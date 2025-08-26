import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET endpoint for token validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify JWT token
    let decoded;
    try {
      const secret = new TextEncoder().encode(JWT_SECRET!);
      const { payload } = await jwtVerify<{
        userId: string;
        email: string;
        type: string;
      }>(token, secret);
      decoded = payload;
    } catch (_jwtError) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (decoded.type !== "password_reset") {
      return NextResponse.json(
        { valid: false, error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.PASSWORD_RESET,
      user: decoded.userId,
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { valid: false, error: "Token not found" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      // Clean up expired token
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { valid: false, error: "Token has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        email: decoded.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Token validation failed" },
      { status: 500 }
    );
  }
}

// POST endpoint for password reset
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 }
      );
    }

    // Verify the JWT token
    let decoded;
    try {
      const secret = new TextEncoder().encode(JWT_SECRET!);
      const { payload } = await jwtVerify<{
        userId: string;
        email: string;
        type: string;
      }>(token, secret);
      decoded = payload;
    } catch (_jwtError) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (decoded.type !== "password_reset") {
      return NextResponse.json(
        { success: false, error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.PASSWORD_RESET,
      user: decoded.userId,
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      // Clean up expired token
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { success: false, error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await User.findByIdAndUpdate(decoded.userId, {
      passwordHash,
      lastPasswordChange: new Date(),
      // Reset login attempts if account was locked
      $unset: { loginAttempts: 1, lockUntil: 1 },
    });

    // Clean up all password reset tokens for this user
    await Token.deleteMany({
      user: decoded.userId,
      type: TokenType.PASSWORD_RESET,
    });

    // Also clean up any auth tokens to force re-login
    await Token.deleteMany({
      user: decoded.userId,
      type: TokenType.AUTH,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Password reset failed. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
