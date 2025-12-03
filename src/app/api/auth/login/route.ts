import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";
import { UserStatus, AuthType } from "@/lib/properties";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password field
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is using Google auth
    if (user.authType === AuthType.GOOGLE && !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Please sign in with Google" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { success: false, error: `Account is locked. Try again in ${remainingMinutes} minutes.` },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();

      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is active
    if (user.status === UserStatus.SUSPENDED) {
      return NextResponse.json(
        { success: false, error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      return NextResponse.json(
        { success: false, error: "Your account is inactive. Please contact support." },
        { status: 403 }
      );
    }

    // Build update: reset login attempts, update last login, activate pending users
    const updateSet: any = { lastLogin: new Date() };
    const updateUnset: any = {};

    if (user.loginAttempts > 0) {
      updateSet.loginAttempts = 0;
      updateUnset.lockUntil = 1;
    }

    // Activate pending users on successful login
    if (user.status === UserStatus.PENDING) {
      updateSet.status = UserStatus.ACTIVE;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: updateSet,
        ...(Object.keys(updateUnset).length > 0 ? { $unset: updateUnset } : {}),
      }
    );

    // Generate JWT token
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
