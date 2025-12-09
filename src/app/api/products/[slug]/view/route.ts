import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Profile from "@/models/Profile";
import User from "@/models/User";
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
    // Find product
    // ────────────────────────────────
    const product = await Product.findOne({ slug, isActive: true })
      .select("_id name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    let userObjectId: Types.ObjectId | null = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      userObjectId = new Types.ObjectId(userId);
    }

    // ────────────────────────────────
    // Track view using unified analytics
    // ────────────────────────────────
    await trackEvent({
      eventType: "product_view",
      entityType: "product",
      entityId: (product._id as Types.ObjectId).toString(),
      entitySlug: (product as any).slug,
      entityName: (product as any).name,
      sessionId: sessionId || request.headers.get("x-session-id") || undefined,
      userId: userObjectId?.toString(),
      ip,
      metadata: { userAgent, referrer: referer },
    });

    // ────────────────────────────────
    // Recently viewed (via User → Profile)
    // ────────────────────────────────
    if (userObjectId) {
      updateRecentlyViewed(userObjectId, product._id as Types.ObjectId).catch(
        (err) => console.error("recentlyViewed update error:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("View tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view" },
      { status: 500 }
    );
  }
}

// ────────────────────────────────
// Update recentlyViewed using User → Profile
// ────────────────────────────────
async function updateRecentlyViewed(
  userId: Types.ObjectId,
  productId: Types.ObjectId
) {
  const user = await User.findById(userId).select("profile").lean();
  const profileId = user?.profile as Types.ObjectId | undefined;
  if (!profileId) return;

  // 1) Remove existing occurrence
  await Profile.updateOne(
    { _id: profileId },
    { $pull: { recentlyViewed: productId } }
  );

  // 2) Add at front, keep max 20
  await Profile.updateOne(
    { _id: profileId },
    {
      $push: {
        recentlyViewed: {
          $each: [productId],
          $position: 0,
          $slice: 20,
        },
      },
    }
  );
}
