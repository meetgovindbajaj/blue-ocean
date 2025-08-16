import dbConnect from "@/lib/db";
import { TokenType, UserStatus } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { token }: { token: string } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.EMAIL_VERIFICATION,
    }).populate("user");

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.isVerified) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Update user verification status
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });

    // Delete the verification token
    await Token.deleteOne({ _id: tokenDoc._id });

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now log in.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.EMAIL_VERIFICATION,
    }).populate("user");

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.isVerified) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Update user verification status
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });

    // Delete the verification token
    await Token.deleteOne({ _id: tokenDoc._id });

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now log in.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
