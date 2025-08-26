import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/emailService";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, token } = body;

    let userEmail = email;
    let _userId: string | undefined;

    // If token is provided, extract email from it
    if (token && !email) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET!);
        const { payload } = await jwtVerify<{
          userId: string;
          email: string;
          type: string;
        }>(token, secret);
        const decoded = payload;

        if (decoded.type === "email_verification") {
          userEmail = decoded.email;
          _userId = decoded.userId;
        }
      } catch (_jwtError) {
        // Token is invalid, continue with email-based lookup
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account with this email exists, a verification email has been sent.",
        },
        { status: 200 }
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: "This email address is already verified" },
        { status: 400 }
      );
    }

    // Check for existing verification tokens and rate limiting
    const existingTokens = await Token.find({
      user: user._id,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    // Rate limiting: Allow only 3 verification emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = existingTokens.filter((t) => t.createdAt > oneHourAgo);

    if (recentTokens.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many verification emails sent. Please wait before requesting another.",
        },
        { status: 429 }
      );
    }

    // Delete old verification tokens for this user
    await Token.deleteMany({
      user: user._id,
      type: TokenType.EMAIL_VERIFICATION,
    });
    const userObject = user.toObject();
    const secret = new TextEncoder().encode(JWT_SECRET!);

    // Generate new verification token
    const verificationToken = await new SignJWT({
      userId: userObject._id.toString(),
      email: userEmail,
      type: "email_verification",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // 24 hour expiry
      .sign(secret);

    // Store new verification token
    const tokenDoc = new Token({
      user: user._id,
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    await tokenDoc.save();

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        userEmail,
        user.name,
        verificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Verification email sent successfully. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to resend verification email. Please try again later.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
