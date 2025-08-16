import dbConnect from "@/lib/db";
import { AuthType, TokenType, UserStatus } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { code }: { code: string } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Google token exchange failed:", error);
      return NextResponse.json(
        { error: "Failed to exchange authorization code" },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get user information from Google" },
        { status: 400 }
      );
    }

    const googleUser = await userResponse.json();
    const { id: googleId, email, name, picture: _picture } = googleUser;

    if (!email || !googleId) {
      return NextResponse.json(
        { error: "Invalid user data from Google" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      // User exists, update Google ID if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authType = AuthType.GOOGLE;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email,
        name,
        googleId,
        authType: AuthType.GOOGLE,
        isVerified: true, // Google accounts are pre-verified
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await user.save();
    }

    // Generate JWT token
    const authToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      {
        algorithm: "HS256",
      }
    );

    // Store auth token
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
    } else {
      // Update existing token
      userToken.token = authToken;
      userToken.expiresAt = new Date(Date.now() + expiresAt);
      await userToken.save();
    }

    // Update last login time
    await user.updateOne({
      $set: { lastLogin: new Date() },
    });

    const res = NextResponse.json(
      {
        message: "Google login successful",
        token: userToken.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
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
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to get Google OAuth URL
export async function GET() {
  try {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      }
    )}`;

    return NextResponse.json(
      {
        url: googleAuthUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google OAuth URL generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
