import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import Category from "@/models/Category";
import dbConnect from "@/lib/db";
import { trackEvent, getClientIp } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    // ────────────────────────────────
    // Parse body (for userId, sessionId, etc.)
    // ────────────────────────────────
    let userId: string | null = null;
    let sessionId: string | null = null;
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body.userId === "string") {
        userId = body.userId;
      }
      if (body && typeof body.sessionId === "string") {
        sessionId = body.sessionId;
      }
    } catch {
      // ignore body errors; treat as anonymous
    }

    // ────────────────────────────────
    // Get client IP and metadata
    // ────────────────────────────────
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    // ────────────────────────────────
    // Find Category
    // ────────────────────────────────
    const category = await Category.findOne({ slug, isActive: true })
      .select("_id name slug")
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    let userObjectId: string | undefined;
    if (userId && mongoose.isValidObjectId(userId)) {
      userObjectId = userId;
    }

    // ────────────────────────────────
    // Track view using unified analytics
    // ────────────────────────────────
    await trackEvent({
      eventType: "category_view",
      entityType: "category",
      entityId: ((category as any)._id as Types.ObjectId).toString(),
      entitySlug: (category as any).slug,
      entityName: (category as any).name,
      sessionId: sessionId || request.headers.get("x-session-id") || undefined,
      userId: userObjectId,
      ip,
      metadata: { userAgent, referrer: referer },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("View tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view" },
      { status: 500 }
    );
  }
}
