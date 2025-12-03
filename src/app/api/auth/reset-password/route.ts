import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { hashPassword } from "@/lib/auth";
import { TokenType } from "@/lib/properties";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await Token.findOne({
      token,
      type: TokenType.RESET_PASSWORD,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(resetToken.user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        lastPasswordChange: new Date(),
        loginAttempts: 0,
        $unset: { lockUntil: 1 },
      }
    );

    // Delete the used token
    await Token.deleteOne({ _id: resetToken._id });

    // Delete all other reset tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.RESET_PASSWORD,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
