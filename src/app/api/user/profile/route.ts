import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/user/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    await dbConnect();

    // Need to check if user has password, so select it separately
    const user = await User.findById(authUser.userId)
      .select("-twoFactorSecret -googleId")
      .populate("profile")
      .lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Check if user has a password set (for hasPassword field)
    const userWithPassword = await User.findById(authUser.userId)
      .select("+passwordHash")
      .lean();

    return successResponse({
      user: {
        id: user.id || (user._id as any)?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        authType: user.authType,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        hasPassword: !!userWithPassword?.passwordHash,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse("Failed to get profile");
  }
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { name, phone, avatar, dateOfBirth, gender, address, preferences } = body;

    await dbConnect();

    // Update user name if provided
    if (name) {
      await User.findByIdAndUpdate(authUser.userId, { name });
    }

    // Find user to get profile reference
    const user = await User.findById(authUser.userId).select("profile").lean();
    if (!user?.profile) {
      return errorResponse("Profile not found", 404);
    }

    // Build profile update
    const profileUpdate: any = {};
    if (name) profileUpdate.name = name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (avatar !== undefined) profileUpdate.avatar = avatar;
    if (dateOfBirth !== undefined) profileUpdate.dateOfBirth = dateOfBirth;
    if (gender !== undefined) profileUpdate.gender = gender;
    if (address) {
      if (address.street !== undefined) profileUpdate["address.street"] = address.street;
      if (address.city !== undefined) profileUpdate["address.city"] = address.city;
      if (address.state !== undefined) profileUpdate["address.state"] = address.state;
      if (address.postalCode !== undefined) profileUpdate["address.postalCode"] = address.postalCode;
      if (address.country !== undefined) profileUpdate["address.country"] = address.country;
    }
    if (preferences) {
      // Merge preferences
      profileUpdate["preferences.newsletter"] = preferences.newsletter;
      profileUpdate["preferences.promotions"] = preferences.promotions;
      profileUpdate["preferences.currency"] = preferences.currency;
      profileUpdate["preferences.language"] = preferences.language;
      if (preferences.notifications) {
        profileUpdate["preferences.notifications.email"] = preferences.notifications.email;
        profileUpdate["preferences.notifications.sms"] = preferences.notifications.sms;
        profileUpdate["preferences.notifications.push"] = preferences.notifications.push;
      }
    }

    const updatedProfile = await Profile.findByIdAndUpdate(
      user.profile,
      { $set: profileUpdate },
      { new: true }
    ).lean();

    return successResponse({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Failed to update profile");
  }
}
