import dbConnect from "@/lib/db";
import { AuthType, TokenType, UserStatus } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

export async function POST(request: NextRequest) {
  try {
    console.log("Google OAuth POST request received");
    await dbConnect();
    console.log("Database connected successfully");

    const body = await request.json();
    const { code }: { code: string } = body;
    console.log("Authorization code received:", code ? "Yes" : "No");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Google token exchange failed:", error);
      return NextResponse.json(
        { error: "Failed to exchange authorization code" },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get user information from Google" },
        { status: 400 }
      );
    }

    const googleUser = await userResponse.json();
    console.log("Google user data received:", {
      hasId: !!googleUser.id,
      hasEmail: !!googleUser.email,
      hasName: !!googleUser.name,
    });

    const { id: googleId, email, name, picture: _picture } = googleUser;

    if (!email || !googleId) {
      console.error("Invalid user data from Google:", { email, googleId });
      return NextResponse.json(
        { error: "Invalid user data from Google" },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log("Checking for existing user with email:", email);
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      console.log("Existing user found:", user._id);
      // User exists, update Google ID if needed
      if (!user.googleId) {
        console.log("Updating existing user with Google ID");
        user.googleId = googleId;
        user.authType = AuthType.GOOGLE;
        await user.save();
      }
    } else {
      console.log("Creating new user with Google data");
      // Create new user
      user = new User({
        email,
        name,
        googleId,
        authType: AuthType.GOOGLE,
        isVerified: true, // Google accounts are pre-verified
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await user.save();
      console.log("New user created with ID:", user._id);
    }

    // Generate JWT token
    console.log("Generating JWT token for user:", user._id);
    const userObject = user.toObject();
    const secret = new TextEncoder().encode(JWT_SECRET);
    const authToken = await new SignJWT({
      userId: userObject._id.toString(),
      id: userObject._id.toString(), // Keep for backward compatibility
      email: userObject.email,
      name: userObject.name,
      role: userObject.role,
      permissions: userObject.permissions,
      emailVerified: userObject.isVerified,
      isVerified: userObject.isVerified,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // 1 hour expiry
      .sign(secret);
    // Store auth token
    console.log("Looking for existing auth token");
    let userToken = await Token.findOne({
      user: user._id,
      type: TokenType.AUTH,
    });

    const expiresAt = 86400000; // 1 day in milliseconds

    if (!userToken) {
      console.log("Creating new auth token");
      userToken = new Token({
        user: user._id,
        token: authToken,
        type: TokenType.AUTH,
        expiresAt: new Date(Date.now() + expiresAt),
      });
      await userToken.save();
      console.log("New auth token created:", userToken._id);
    } else {
      console.log("Updating existing auth token");
      // Update existing token
      userToken.token = authToken;
      userToken.expiresAt = new Date(Date.now() + expiresAt);
      await userToken.save();
    }

    // Update last login time
    console.log("Updating last login time");
    await user.updateOne({
      $set: { lastLogin: new Date() },
    });

    console.log("Google OAuth flow completed successfully");
    const res = NextResponse.json(
      {
        message: "Google login successful",
        token: userToken.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    res.cookies.set("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresAt / 1000, // Convert to seconds for cookie
    });

    return res;
  } catch (error) {
    console.error("Google OAuth error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get Google OAuth URL
export async function GET() {
  try {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      }
    )}`;

    return NextResponse.json(
      {
        url: googleAuthUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google OAuth URL generation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
