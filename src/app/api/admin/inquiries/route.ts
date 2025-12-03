import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import "@/models/Product"; // Required for populate
import "@/models/User"; // Required for populate
import {
  getAuthUser,
  isAdmin,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  successResponse,
} from "@/lib/apiAuth";

// GET /api/admin/inquiries - List all inquiries
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .populate("productId", "id name slug")
        .populate("userId", "id name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(query),
    ]);

    // Get status counts
    const statusCounts = await Inquiry.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = {
      total,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    statusCounts.forEach((s: any) => {
      if (s._id in counts) {
        (counts as any)[s._id] = s.count;
      }
    });

    return successResponse({
      inquiries: inquiries.map((inquiry: any) => ({
        id: inquiry.id || inquiry._id?.toString(),
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        message: inquiry.message,
        status: inquiry.status,
        priority: inquiry.priority,
        product: inquiry.productId
          ? {
              id: inquiry.productId.id || inquiry.productId._id?.toString(),
              name: inquiry.productId.name,
              slug: inquiry.productId.slug,
            }
          : null,
        user: inquiry.userId
          ? {
              id: inquiry.userId.id || inquiry.userId._id?.toString(),
              name: inquiry.userId.name,
              email: inquiry.userId.email,
            }
          : null,
        notes: inquiry.notes || [],
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      counts,
    });
  } catch (error) {
    console.error("Admin Inquiries GET error:", error);
    return errorResponse("Failed to fetch inquiries");
  }
}
