import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/emailService";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success for security (don't reveal if user exists)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account with this email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Check for existing password reset tokens and rate limiting
    const existingTokens = await Token.find({
      user: user._id,
      type: TokenType.PASSWORD_RESET,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    // Rate limiting: Allow only 3 password reset emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = existingTokens.filter((t) => t.createdAt > oneHourAgo);

    if (recentTokens.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many password reset requests. Please wait before requesting another.",
        },
        { status: 429 }
      );
    }

    // Delete old password reset tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.PASSWORD_RESET,
    });

    // Generate password reset token (shorter expiry for security)
    const userObject = user.toObject();
    const secret = new TextEncoder().encode(JWT_SECRET);
    const resetToken = await new SignJWT({
      userId: userObject._id.toString(),
      email: normalizedEmail,
      type: "password_reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h") // 1 hour expiry
      .sign(secret);

    // Store password reset token
    const tokenDoc = new Token({
      user: user._id,
      token: resetToken,
      type: TokenType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    await tokenDoc.save();

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(
        normalizedEmail,
        user.name,
        resetToken
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send password reset email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset email sent successfully. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process password reset request. Please try again later.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
