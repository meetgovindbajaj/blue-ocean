import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import {
  getAuthUser,
  unauthorizedResponse,
  errorResponse,
  successResponse,
} from "@/lib/apiAuth";

// POST /api/user/inquiries/[id]/comment - Add user comment to inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return errorResponse("Comment is required", 400);
    }

    if (comment.length > 1000) {
      return errorResponse("Comment cannot exceed 1000 characters", 400);
    }

    await dbConnect();

    // Find inquiry and verify ownership
    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return errorResponse("Inquiry not found", 404);
    }

    // Verify user owns this inquiry (by userId or email)
    const isOwner =
      (inquiry.userId && inquiry.userId.toString() === authUser.userId) ||
      inquiry.email === authUser.email;

    if (!isOwner) {
      return errorResponse("You don't have permission to comment on this inquiry", 403);
    }

    // Verify status is "customer-feedback"
    if (inquiry.status !== "customer-feedback") {
      return errorResponse(
        "Comments can only be added when the inquiry is awaiting your feedback",
        400
      );
    }

    // Add comment to userComments array
    if (!inquiry.userComments) {
      inquiry.userComments = [];
    }
    (inquiry.userComments as any[]).push({
      comment: comment.trim(),
      timestamp: new Date(),
    });

    // Auto-transition status to "in-progress"
    inquiry.status = "in-progress";

    await inquiry.save();

    return successResponse({
      message: "Comment added successfully",
      inquiry: {
        id: inquiry._id?.toString(),
        status: inquiry.status,
        userComments: inquiry.userComments,
      },
    });
  } catch (error) {
    console.error("Add user comment error:", error);
    return errorResponse("Failed to add comment");
  }
}
