import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import { getAuthUser, isAdmin, unauthorizedResponse, forbiddenResponse, errorResponse, successResponse } from "@/lib/apiAuth";
import { sendEmail } from "@/lib/email";

// GET /api/admin/inquiries/[id] - Get single inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    await dbConnect();

    const inquiry = await Inquiry.findById(id)
      .populate("productId", "id name slug images")
      .populate("userId", "id name email")
      .lean();

    if (!inquiry) {
      return errorResponse("Inquiry not found", 404);
    }

    return successResponse({
      inquiry: {
        id: (inquiry as any).id || (inquiry as any)._id?.toString(),
        name: (inquiry as any).name,
        email: (inquiry as any).email,
        phone: (inquiry as any).phone,
        message: (inquiry as any).message,
        status: (inquiry as any).status,
        priority: (inquiry as any).priority,
        product: (inquiry as any).productId
          ? {
              id: (inquiry as any).productId.id || (inquiry as any).productId._id?.toString(),
              name: (inquiry as any).productId.name,
              slug: (inquiry as any).productId.slug,
              images: (inquiry as any).productId.images,
            }
          : null,
        user: (inquiry as any).userId
          ? {
              id: (inquiry as any).userId.id || (inquiry as any).userId._id?.toString(),
              name: (inquiry as any).userId.name,
              email: (inquiry as any).userId.email,
            }
          : null,
        notes: (inquiry as any).notes || [],
        createdAt: (inquiry as any).createdAt,
        updatedAt: (inquiry as any).updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin Inquiry GET error:", error);
    return errorResponse("Failed to fetch inquiry");
  }
}

// PUT /api/admin/inquiries/[id] - Update inquiry status/notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, sendResponse, responseMessage } = body;

    await dbConnect();

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return errorResponse("Inquiry not found", 404);
    }

    // Update fields
    if (status) inquiry.status = status;

    // Add admin note if provided
    if (adminNotes && user.userId) {
      if (!inquiry.notes) inquiry.notes = [];
      (inquiry.notes as any[]).push({
        adminId: user.userId,
        note: adminNotes,
        timestamp: new Date(),
      });
    }

    // Send response email if requested
    if (sendResponse && responseMessage) {
      try {
        await sendEmail({
          to: inquiry.email,
          subject: `Re: Your Inquiry - ${inquiry.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Response to Your Inquiry</h2>
              <p>Dear ${inquiry.name},</p>
              <p>Thank you for contacting us. Here is our response to your inquiry:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;">${responseMessage}</p>
              </div>
              <p>If you have any further questions, please don't hesitate to reach out.</p>
              <p>Best regards,<br>Customer Support Team</p>
            </div>
          `,
        });
        inquiry.status = "resolved";
        // Also save the response message as a note
        if (!inquiry.notes) inquiry.notes = [];
        (inquiry.notes as any[]).push({
          adminId: user.userId,
          note: `[Email Response Sent] ${responseMessage}`,
          timestamp: new Date(),
        });
      } catch (emailError) {
        console.error("Failed to send response email:", emailError);
        // Continue with update even if email fails
      }
    }

    await inquiry.save();

    return successResponse({
      message: "Inquiry updated successfully",
      inquiry: {
        id: inquiry._id?.toString(),
        status: inquiry.status,
        notes: inquiry.notes,
      },
    });
  } catch (error) {
    console.error("Admin Inquiry PUT error:", error);
    return errorResponse("Failed to update inquiry");
  }
}

// DELETE /api/admin/inquiries/[id] - Delete inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    await dbConnect();

    const inquiry = await Inquiry.findByIdAndDelete(id);

    if (!inquiry) {
      return errorResponse("Inquiry not found", 404);
    }

    return successResponse({
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Admin Inquiry DELETE error:", error);
    return errorResponse("Failed to delete inquiry");
  }
}
