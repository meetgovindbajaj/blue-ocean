import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import "@/models/Product"; // Required for populate
import {
  getAuthUser,
  unauthorizedResponse,
  errorResponse,
  successResponse,
} from "@/lib/apiAuth";

// GET /api/user/inquiries - Get current user's inquiries
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Find inquiries by user ID or email
    const inquiries = await Inquiry.find({
      $or: [{ userId: authUser.userId }, { email: authUser.email }],
    })
      .sort({ createdAt: -1 })
      .populate("productId", "id name slug images")
      .lean();

    return successResponse({
      inquiries: inquiries.map((inquiry: any) => ({
        id: inquiry.id || inquiry._id?.toString(),
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        priority: inquiry.priority,
        product: inquiry.productId
          ? {
              id: inquiry.productId.id || inquiry.productId._id?.toString(),
              name: inquiry.productId.name,
              slug: inquiry.productId.slug,
              image:
                inquiry.productId.images?.[0]?.thumbnailUrl ||
                inquiry.productId.images?.[0]?.url,
            }
          : null,
        notes: inquiry.notes || [],
        userComments: inquiry.userComments || [],
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get user inquiries error:", error);
    return errorResponse("Failed to get inquiries");
  }
}
