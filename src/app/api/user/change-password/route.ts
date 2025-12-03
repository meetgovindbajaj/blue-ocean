import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword, comparePassword } from "@/lib/auth";
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from "@/lib/apiAuth";
import { AuthType } from "@/lib/properties";

// POST /api/user/change-password - Change password
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return errorResponse("New password must be at least 8 characters", 400);
    }

    await dbConnect();

    const user = await User.findById(authUser.userId).select("+passwordHash authType").lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // If user has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return errorResponse("Current password is required", 400);
      }

      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return errorResponse("Current password is incorrect", 400);
      }
    }
    // If Google user without password, allow adding a password (no current password required)

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.findByIdAndUpdate(authUser.userId, {
      passwordHash: newPasswordHash,
      lastPasswordChange: new Date(),
    });

    return successResponse({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to change password");
  }
}
