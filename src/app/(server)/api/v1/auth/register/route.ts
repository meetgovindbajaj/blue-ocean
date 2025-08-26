import dbConnect from "@/lib/db";
import { AuthType, TokenType, UserRole, UserStatus } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/emailService";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Input validation helper
const validateRegistrationInput = (data: RegisterRequest) => {
  const errors: string[] = [];

  // Name validation
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters long");
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters long");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!data.password || data.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(data.password)) {
    errors.push(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
  }

  return errors;
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { firstName, lastName, email, password }: RegisterRequest = body;

    // Validate input
    const validationErrors = validateRegistrationInput({
      firstName,
      lastName,
      email,
      password,
    });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create full name
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Create new user
    const newUser = new User({
      email: normalizedEmail,
      name: fullName,
      passwordHash,
      authType: AuthType.MANUAL,
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING,
      isVerified: false,
      permissions: [],
      loginAttempts: 0,
      twoFactorEnabled: false,
    });

    await newUser.save();
    const userObject = newUser.toObject();
    // Generate email verification token
    const secret = new TextEncoder().encode(JWT_SECRET!);

    const verificationToken = await new SignJWT({
      userId: userObject._id.toString(),
      email: normalizedEmail,
      type: "email_verification",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // 24 hour expiry
      .sign(secret);

    // Store verification token
    const tokenDoc = new Token({
      user: newUser._id,
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    await tokenDoc.save();

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        normalizedEmail,
        fullName,
        verificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isVerified: newUser.isVerified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes("E11000")) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Registration failed. Please try again later.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for registration form validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("email");

    return NextResponse.json({
      available: !existingUser,
      message: existingUser
        ? "Email is already registered"
        : "Email is available",
    });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { error: "Failed to check email availability" },
      { status: 500 }
    );
  }
}
