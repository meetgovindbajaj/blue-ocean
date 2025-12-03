import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import { Types } from "mongoose";
import {
  getAuthUser,
  isAdmin,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
} from "@/lib/apiAuth";

// PUT /api/admin/users/[id]/profile - Update user's profile (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!isAdmin(authUser.role)) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();

    // Find user first
    const query: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      query.push({ _id: new Types.ObjectId(id) });
    }

    const user = await User.findOne({ $or: query }).select("profile").lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (!user.profile) {
      return errorResponse("User profile not found", 404);
    }

    // Build profile update
    const { phone, dateOfBirth, gender, address } = body;
    const profileUpdate: any = {};

    if (phone !== undefined) profileUpdate.phone = phone;
    if (dateOfBirth !== undefined) profileUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) profileUpdate.gender = gender || null;

    if (address) {
      if (address.street !== undefined) profileUpdate["address.street"] = address.street;
      if (address.city !== undefined) profileUpdate["address.city"] = address.city;
      if (address.state !== undefined) profileUpdate["address.state"] = address.state;
      if (address.postalCode !== undefined) profileUpdate["address.postalCode"] = address.postalCode;
      if (address.country !== undefined) profileUpdate["address.country"] = address.country;
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
    console.error("Admin Update Profile error:", error);
    return errorResponse("Failed to update profile");
  }
}

// GET /api/admin/users/[id]/profile - Get user's profile (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!isAdmin(authUser.role)) return forbiddenResponse();

    const { id } = await params;

    const query: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      query.push({ _id: new Types.ObjectId(id) });
    }

    const user = await User.findOne({ $or: query })
      .select("profile")
      .populate("profile")
      .lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
      profile: user.profile,
    });
  } catch (error) {
    console.error("Admin Get Profile error:", error);
    return errorResponse("Failed to get profile");
  }
}
