import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HeroBanner, { IHeroBanner } from "@/models/HeroBanner";
import Product from "@/models/Product";
import "@/models/Category";
import { AnalyticsEvent } from "@/models/Analytics";
import { trackEvent, getClientIp } from "@/lib/analytics";
import { transformBanner } from "@/lib/transformers/heroBanner";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);
    const includeAuto = searchParams.get("includeAuto") !== "false";
    const now = new Date();

    // Auto-deactivate expired banners (end date has passed)
    await HeroBanner.updateMany(
      {
        isActive: true,
        endDate: { $lt: now, $ne: null },
      },
      { $set: { isActive: false } }
    );

    const query = {
      isActive: true,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
    };

    // Manual banners
    const manualBanners = await HeroBanner.find({
      ...query,
      sourceType: "manual",
    })
      .sort({ order: 1 })
      .limit(limit)
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    let allBanners: any[] = [...manualBanners];

    // Auto banners
    if (includeAuto) {
      const autoBanners = await HeroBanner.find({
        ...query,
        sourceType: "auto",
      })
        .sort({ order: 1 })
        .lean();

      for (const auto of autoBanners) {
        const enriched = await processAutoBanner(auto as IHeroBanner);
        if (enriched) allBanners.push(enriched);
      }
    }

    allBanners.sort((a, b) => a.order - b.order);
    allBanners = allBanners.slice(0, limit);

    const responseData = allBanners.map((b) => transformBanner(b, false));

    // Track impressions for all displayed banners
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const sessionId = request.headers.get("x-session-id") || undefined;
    const userId = request.headers.get("x-user-id") || undefined;

    // Fire-and-forget: track impressions
    trackImpressions(allBanners, ip, userAgent, sessionId, userId).catch(
      () => {}
    );

    return NextResponse.json(
      { success: true, banners: responseData },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Hero Banners API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hero banners" },
      { status: 500 }
    );
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TRACK IMPRESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
async function trackImpressions(
  banners: any[],
  ip: string,
  userAgent: string,
  sessionId?: string,
  userId?: string
) {
  try {
    // Track each banner impression
    const trackPromises = banners.map((banner) =>
      trackEvent({
        eventType: "banner_impression",
        entityType: "banner",
        entityId: banner._id.toString(),
        entityName: banner.name,
        sessionId,
        userId,
        ip,
        metadata: { userAgent },
      })
    );

    await Promise.all(trackPromises);
  } catch (error) {
    console.error("Track impressions error:", error);
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AUTO-BANNER PROCESSOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
async function processAutoBanner(banner: IHeroBanner): Promise<any | null> {
  const config = banner.content?.autoConfig || {};
  const limit = config.limit || 5;
  const period = config.period || "week";

  let products: any[] = [];
  let autoTitle = banner.content?.title;
  let autoSubtitle = banner.content?.subtitle;

  switch (banner.contentType) {
    case "product": {
      const rawProductId: any = banner.content?.productId;
      const productId = rawProductId?._id || rawProductId?.id || rawProductId;

      if (!productId) return null;

      const product = await Product.findById(productId)
        .select("name slug prices images category")
        .populate("category", "name slug")
        .lean();

      if (!product) return null;

      return {
        ...banner,
        content: {
          ...banner.content,
          title: banner.content?.title || product.name,
          productId: product,
        },
      };
    }
    case "custom":
      // Custom banners don't need auto-enrichment; return as-is.
      return banner;
    case "trending": {
      const dateRange = getDateRange(period);

      // Use AnalyticsEvent for trending data
      const trendingStats = await AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "product",
            eventType: "product_view",
            ...(dateRange ? { createdAt: { $gte: dateRange } } : {}),
          },
        },
        { $group: { _id: "$entityId", totalViews: { $sum: 1 } } },
        { $sort: { totalViews: -1 } },
        { $limit: limit },
      ]);

      const productIds = trendingStats.map((s) => s._id);
      const productQuery: any = { isActive: true };

      if (productIds.length) {
        productQuery._id = { $in: productIds };
      }
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .populate("category", "name slug")
        .lean();

      // Fallback: if no trending data or no products matched,
      // show latest products in the same category instead.
      if (!products.length) {
        const fallbackQuery: any = { isActive: true };
        if (config.categoryFilter) {
          fallbackQuery.category = config.categoryFilter;
        }

        products = await Product.find(fallbackQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("category", "name slug")
          .lean();
      }

      const scoreMap = new Map(
        trendingStats.map((s) => [s._id?.toString(), s.totalViews])
      );

      if (products.length && productIds.length) {
        products.sort(
          (a, b) =>
            (scoreMap.get(b._id.toString()) || 0) -
            (scoreMap.get(a._id.toString()) || 0)
        );
      }

      autoTitle ||= banner.content?.title || "Trending Now";
      autoSubtitle ||=
        banner.content?.subtitle || "Most viewed products this " + period;
      break;
    }

    case "new_arrivals": {
      const productQuery: any = { isActive: true };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      autoTitle ||= banner.content?.title || "New Arrivals";
      autoSubtitle ||=
        banner.content?.subtitle || "Fresh additions to our collection";
      break;
    }

    case "offer": {
      const productQuery: any = {
        isActive: true,
        "prices.discount": { $gt: 0 },
      };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ "prices.discount": -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      const maxDiscount = products[0]?.prices?.discount || 0;
      autoTitle ||= banner.content?.title || `Up to ${maxDiscount}% Off`;
      autoSubtitle ||= banner.content?.subtitle || "Limited time offers";
      break;
    }

    default:
      return null;
  }

  if (!products.length) {
    // absolutely nothing to show (no products in DB)
    return null;
  }

  return {
    ...banner,
    content: {
      ...banner.content,
      title: autoTitle,
      subtitle: autoSubtitle,
      autoProducts: products.map((p) => ({
        id: p.id || p._id?.toString(),
        name: p.name,
        slug: p.slug,
        prices: p.prices,
        thumbnail:
          p.images?.find((img: any) => img.isThumbnail) || p.images?.[0],
        category: p.category,
      })),
    },
  };
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DATE RANGE HELPER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getDateRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
