import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import {
  getGoogleOAuthTokens,
  getGoogleUser,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";
import { AuthType, UserStatus } from "@/lib/properties";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${APP_URL}/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await getGoogleOAuthTokens(code);

    if (tokens.error) {
      console.error("Google tokens error:", tokens.error);
      return NextResponse.redirect(
        `${APP_URL}/login?error=token_exchange_failed`
      );
    }

    // Get user info from Google
    const googleUser = await getGoogleUser(
      tokens.access_token,
      tokens.id_token
    );

    if (!googleUser.email) {
      return NextResponse.redirect(`${APP_URL}/login?error=no_email`);
    }

    await connectDB();

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail }).select(
      "+googleId"
    );

    if (user) {
      // User exists - check if they used Google before
      if (user.authType === AuthType.MANUAL && !user.googleId) {
        // Link Google account to existing manual account
        await User.updateOne(
          { _id: user._id },
          {
            googleId: googleUser.id,
            isVerified: true,
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
            status: UserStatus.ACTIVE,
          }
        );
      } else if (user.googleId !== googleUser.id) {
        // Different Google account trying to use same email
        return NextResponse.redirect(`${APP_URL}/login?error=email_in_use`);
      }

      // Update last login
      await User.updateOne({ _id: user._id }, { lastLogin: new Date() });
    } else {
      // Create new user with Google account
      user = new User({
        name: googleUser.name || googleUser.email.split("@")[0],
        email: normalizedEmail,
        googleId: googleUser.id,
        authType: AuthType.GOOGLE,
        isVerified: true,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      });

      await user.save();
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Redirect to home page
    return NextResponse.redirect(`${APP_URL}/`);
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${APP_URL}/login?error=callback_failed`);
  }
}
