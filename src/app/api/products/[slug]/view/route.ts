import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Profile from "@/models/Profile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * Product View Tracking API
 *
 * NOTE: Primary view tracking is now done client-side via /api/analytics/track
 * which provides better user identification (userId from AuthContext, sessionId
 * from localStorage). This endpoint is kept for:
 * 1. Updating the user's "recently viewed" list
 * 2. Legacy support / direct API calls
 *
 * The client-side tracking in ProductDetailClient uses debounce (500ms) to
 * prevent rapid duplicate views and properly identifies users.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    // ────────────────────────────────
    // Parse body (for userId)
    // ────────────────────────────────
    let userId: string | null = null;
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body.userId === "string") {
        userId = body.userId;
      }
    } catch {
      // ignore body errors; treat as anonymous
    }

    // ────────────────────────────────
    // Find product
    // ────────────────────────────────
    const product = await Product.findOne({ slug, isActive: true })
      .select("_id")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // ────────────────────────────────
    // Recently viewed (via User → Profile)
    // ────────────────────────────────
    if (userId && mongoose.isValidObjectId(userId)) {
      const userObjectId = new Types.ObjectId(userId);
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
