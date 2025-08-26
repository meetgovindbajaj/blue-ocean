import dbConnect from "@/lib/db";
import { TokenType, UserStatus } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
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
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (decoded.type !== "email_verification") {
      return NextResponse.json(
        { success: false, error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.EMAIL_VERIFICATION,
      user: decoded.userId,
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      // Clean up expired token
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { success: false, error: "Verification token has expired" },
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

    if (user.isVerified) {
      // Clean up token since user is already verified
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Update user verification status
    await User.findByIdAndUpdate(decoded.userId, {
      isVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });

    // Clean up verification token
    await Token.deleteOne({ _id: tokenDoc._id });

    return NextResponse.json(
      {
        success: true,
        message:
          "Email verified successfully! You can now log in to your account.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Email verification failed. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for token validation (optional)
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

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.EMAIL_VERIFICATION,
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
