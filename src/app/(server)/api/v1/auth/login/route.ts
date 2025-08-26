import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
const JWT_SECRET = process.env.JWT_SECRET as string;
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password }: { email: string; password: string } = body;
    if (!email || !password) {
      return new NextResponse("Email and password are required", {
        status: 400,
      });
    }
    const user = await User.findOne(
      { email },
      {
        passwordHash: 1,
        _id: 1,
        role: 1,
        permissions: 1,
        loginAttempts: 1,
        lockUntil: 1,
        isVerified: 1,
      }
    );

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json(
        {
          error:
            "Please verify your email address before logging in. Check your inbox for the verification link.",
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (user.isLocked) {
      return NextResponse.json(
        { error: "Account is temporarily locked. Please try again later." },
        { status: 423 }
      );
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return new NextResponse("Invalid password", { status: 401 });
    }
    const userObject = user.toObject();

    const secret = new TextEncoder().encode(JWT_SECRET);
    const authToken = await new SignJWT({
      id: userObject._id.toString(),
      role: userObject.role,
      permissions: userObject.permissions, // Now a plain array
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);
    let userToken = await Token.findOne({
      user: user._id,
      type: TokenType.AUTH,
    });
    const expiresAt = 86400000; // 1 day in milliseconds
    if (!userToken) {
      userToken = new Token({
        user: user._id,
        token: authToken,
        type: TokenType.AUTH,
        expiresAt: new Date(Date.now() + expiresAt),
      });
      await userToken.save();
    }

    // Update last login time
    // Reset login attempts on successful login
    await user.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
      $set: { lastLogin: new Date() },
    });

    const res = NextResponse.json(
      {
        message: "Login successful",
        token: userToken.token,
      },
      { status: 200 }
    );
    res.cookies.set("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresAt / 1000, // Convert to seconds for cookie
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
