import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { hashPassword, generateVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { TokenType, UserStatus, AuthType } from "@/lib/properties";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      authType: AuthType.MANUAL,
      status: UserStatus.PENDING,
      isVerified: false,
    });

    await user.save();

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Save token to database
    const token = new Token({
      user: user._id,
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
    });

    await token.save();

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken, name);

    return NextResponse.json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
