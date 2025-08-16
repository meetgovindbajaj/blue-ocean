import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import emailService from "@/lib/emailService";

// POST - Request password reset
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email }: { email: string } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Delete any existing password reset tokens
    await Token.deleteMany({
      user: user._id,
      type: TokenType.RESET_PASSWORD,
    });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenDoc = new Token({
      user: user._id,
      token: resetToken,
      type: TokenType.RESET_PASSWORD,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    await tokenDoc.save();

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      user.name,
      resetToken
    );

    if (!emailSent) {
      console.error("Failed to send password reset email");
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Reset password with token
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { token, newPassword }: { token: string; newPassword: string } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find the reset token
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.RESET_PASSWORD,
    }).populate("user");

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      lastPasswordChange: new Date(),
      // Reset login attempts on password change
      $unset: { loginAttempts: 1, lockUntil: 1 },
    });

    // Delete the reset token
    await Token.deleteOne({ _id: tokenDoc._id });

    // Delete all auth tokens to force re-login
    await Token.deleteMany({
      user: user._id,
      type: TokenType.AUTH,
    });

    return NextResponse.json(
      {
        message:
          "Password reset successfully. Please log in with your new password.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Verify reset token
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    // Find the reset token
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.RESET_PASSWORD,
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Reset token is valid",
        valid: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
