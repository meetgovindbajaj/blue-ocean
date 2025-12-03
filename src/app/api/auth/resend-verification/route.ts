import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { generateVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
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

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a verification link.",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "This email is already verified. You can sign in.",
      });
    }

    // Delete any existing verification tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Save token
    const token = new Token({
      user: user._id,
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
    });

    await token.save();

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken, user.name);

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
