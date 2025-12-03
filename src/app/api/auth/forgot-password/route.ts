import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { generateVerificationToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { TokenType } from "@/lib/properties";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Delete any existing reset tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.RESET_PASSWORD,
    });

    // Generate new reset token
    const resetToken = generateVerificationToken();

    // Save token
    const token = new Token({
      user: user._id,
      token: resetToken,
      type: TokenType.RESET_PASSWORD,
    });

    await token.save();

    // Send password reset email
    await sendPasswordResetEmail(normalizedEmail, resetToken, user.name);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
