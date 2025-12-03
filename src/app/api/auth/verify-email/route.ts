import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { TokenType, UserStatus } from "@/lib/properties";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find valid token
    const verificationToken = await Token.findOne({
      token,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(verificationToken.user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isVerified) {
      // Delete the token anyway
      await Token.deleteOne({ _id: verificationToken._id });

      return NextResponse.json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Update user as verified
    await User.updateOne(
      { _id: user._id },
      {
        isVerified: true,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      }
    );

    // Delete the used token
    await Token.deleteOne({ _id: verificationToken._id });

    // Delete all other verification tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
