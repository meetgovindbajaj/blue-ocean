import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import emailService from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      email,
      password,
      name,
    }: { email: string; password: string; name: string } = body;

    if (!email || !password || !name) {
      return new NextResponse("Email, password, and name are required", {
        status: 400,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse("Invalid email format", { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return new NextResponse("Password must be at least 8 characters long", {
        status: 400,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return new NextResponse("User already exists", { status: 409 });
      } else {
        // User exists but not verified, resend verification email
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Delete existing verification token
        await Token.deleteMany({
          user: existingUser._id,
          type: TokenType.EMAIL_VERIFICATION,
        });

        // Create new verification token
        const tokenDoc = new Token({
          user: existingUser._id,
          token: verificationToken,
          type: TokenType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        await tokenDoc.save();

        // Send verification email
        const emailSent = await emailService.sendVerificationEmail(
          email,
          name,
          verificationToken
        );

        if (!emailSent) {
          console.error("Failed to send verification email");
        }

        return NextResponse.json(
          {
            message:
              "User already exists but not verified. Verification email resent.",
            requiresVerification: true,
          },
          { status: 200 }
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      passwordHash,
      name,
      isVerified: false, // User needs to verify email
    });
    await user.save();

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenDoc = new Token({
      user: user._id,
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    await tokenDoc.save();

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      email,
      name,
      verificationToken
    );

    if (!emailSent) {
      console.error("Failed to send verification email");
      // Don't fail registration if email fails, but log it
    }

    return NextResponse.json(
      {
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Manual registration endpoint is working" },
    { status: 200 }
  );
}
