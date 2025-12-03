// /api/products/[slug]/route.ts
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { AnalyticsEvent } from "@/models/Analytics";
import { trackEvent } from "@/lib/analytics";
import User from "@/models/User";
import Profile from "@/models/Profile";
import { PopulateOptions } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// GET product detail. params is Promise<{ slug: string }> (Next.js 15 pattern)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await dbConnect();

    const { searchParams } = new URL(req.url);
    // userId passed as query param (optional). Use for recording view & recentlyViewed.
    const userId = searchParams.get("userId");
    const recordViewParam = searchParams.get("recordView");
    // default: record views unless explicitly set to "false"
    const recordView = recordViewParam === "false" ? false : true;

    let userObjectId: Types.ObjectId | null = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      userObjectId = new Types.ObjectId(userId);
    }

    // Build deep populate for category -> parent chain
    const buildPopulate = (depth = 8): PopulateOptions => {
      const populate: PopulateOptions = {
        path: "category",
        select: "id name slug parent",
      };
      let current: PopulateOptions = populate;
      for (let i = 1; i < depth; i++) {
        current.populate = {
          path: "parent",
          select: "id name slug parent",
        };
        current = current.populate as PopulateOptions;
      }
      return populate;
    };

    // Load product
    const productDoc = await Product.findOne({ slug, isActive: true }).populate(
      buildPopulate()
    );

    if (!productDoc) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = productDoc.toObject();

    // ------------------------------
    // Stats aggregation (read) from unified Analytics
    // ------------------------------
    const now = new Date();
    const dayStart = (offsetDays: number) => {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - offsetDays);
      return d;
    };

    const todayStart = dayStart(0);
    const weekStart = dayStart(7);
    const monthStart = dayStart(30);

    const productIdStr = product._id.toString();

    const statsAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType: "product",
          entityId: productIdStr,
          eventType: "product_view",
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          viewsToday: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0],
            },
          },
          viewsThisWeek: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", weekStart] }, 1, 0],
            },
          },
          viewsThisMonth: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", monthStart] }, 1, 0],
            },
          },
          uniqueIps: { $addToSet: "$ip" },
        },
      },
    ]);

    const agg = statsAgg[0] || {
      totalViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      uniqueIps: [],
    };

    const totalViews = agg.totalViews || 0;
    const viewsToday = agg.viewsToday || 0;
    const viewsThisWeek = agg.viewsThisWeek || 0;
    const viewsThisMonth = agg.viewsThisMonth || 0;
    const uniqueVisitors = agg.uniqueIps?.length || 0;

    // ------------------------------
    // Scoring formula (tweakable)
    // ------------------------------
    const discount = Number(product?.prices?.discount || 0);
    const createdAt = new Date(product.createdAt);
    const daysSinceCreated =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const isNew = daysSinceCreated <= 60;

    const rawScore =
      viewsToday * 4 +
      viewsThisWeek * 2 +
      viewsThisMonth * 1.2 +
      totalViews * 0.5 +
      discount * 0.8 +
      (isNew ? 6 : 0);

    const score = Number(rawScore.toFixed(2));

    // Attach stats to product object (returned)
    product.totalViews = totalViews;
    product.viewsToday = viewsToday;
    product.viewsThisWeek = viewsThisWeek;
    product.viewsThisMonth = viewsThisMonth;
    product.uniqueVisitors = uniqueVisitors;
    product.score = score;

    // Persist stats in background (non-blocking) so listings/trending can use them
    Product.updateOne(
      { _id: product._id },
      { $set: { totalViews, score } }
    ).catch((err) => console.error("Product stats persist error:", err));

    // ------------------------------
    // Breadcrumbs from category parents
    // ------------------------------
    const breadcrumbs: Array<{
      id: string;
      name: string;
      slug: string;
      url: string;
    }> = [];
    let cat: any = product.category;
    while (cat) {
      breadcrumbs.unshift({
        id: cat.id || cat._id?.toString(),
        name: cat.name,
        slug: cat.slug,
        url: `/categories?slug=${cat.slug}`,
      });
      cat = cat.parent;
    }
    breadcrumbs.unshift({ id: "home", name: "Home", slug: "home", url: "/" });

    // ------------------------------
    // Optionally record view & update recentlyViewed
    // ------------------------------
    if (recordView) {
      const ip = getClientIp(req);
      const userAgent = req.headers.get("user-agent") || "";
      const referer = req.headers.get("referer") || "";

      // Fire-and-forget: track view using unified analytics
      trackEvent({
        eventType: "product_view",
        entityType: "product",
        entityId: product._id.toString(),
        entitySlug: product.slug,
        entityName: product.name,
        sessionId: req.headers.get("x-session-id") || undefined,
        userId: userObjectId?.toString(),
        ip,
        metadata: { userAgent, referrer: referer },
      }).catch((err: Error) => console.error("Analytics track error:", err));

      // If logged-in, update Profile.recentlyViewed via User -> Profile
      if (userObjectId) {
        updateRecentlyViewed(userObjectId, product._id as Types.ObjectId).catch(
          (err: Error) => console.error("updateRecentlyViewed error:", err)
        );
      }
    }

    // ------------------------------
    // Build response
    // ------------------------------
    const response = NextResponse.json({
      success: true,
      product,
      breadcrumbs,
    });

    Object.entries(CACHE_HEADERS).forEach(([k, v]) =>
      response.headers.set(k, v)
    );

    return response;
  } catch (error: any) {
    console.error("Product detail API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ------------------------------
// Helpers
// ------------------------------
function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return cfIp || forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1";
}

// Update recentlyViewed via User -> Profile (non-blocking)
async function updateRecentlyViewed(
  userId: Types.ObjectId,
  productId: Types.ObjectId
) {
  try {
    const user = await User.findById(userId).select("profile").lean();
    const profileId = user?.profile as Types.ObjectId | undefined;
    if (!profileId) return;

    // Remove existing occurrence then push to front (keeps ordering)
    await Profile.updateOne(
      { _id: profileId },
      { $pull: { recentlyViewed: productId } }
    );
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
  } catch (err) {
    console.error("updateRecentlyViewed error:", err);
  }
}
