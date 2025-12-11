import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import HeroBanner from "@/models/HeroBanner";
import Tag from "@/models/Tag";
import { AnalyticsEvent } from "@/models/Analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null;
    }

    // Build date match condition for analytics
    const dateMatch = startDate ? { createdAt: { $gte: startDate } } : {};

    // Get overview stats from unified analytics
    const [totalProducts, totalUsers, analyticsOverview, storedBannerClicks] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      AnalyticsEvent.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: null,
            totalViews: {
              $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /view/ } }, 1, 0] },
            },
            totalClicks: {
              $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /click/ } }, 1, 0] },
            },
            uniqueIps: { $addToSet: "$ip" },
          },
        },
      ]),
      // Also get stored banner clicks that may not be in analytics events (legacy data)
      HeroBanner.aggregate([
        { $group: { _id: null, totalClicks: { $sum: "$clicks" } } },
      ]),
    ]);

    // Use the higher of analytics clicks or stored banner clicks for total
    const analyticsClicks = analyticsOverview[0]?.totalClicks || 0;
    const bannerStoredClicks = storedBannerClicks[0]?.totalClicks || 0;

    const overview = {
      totalViews: analyticsOverview[0]?.totalViews || 0,
      totalClicks: Math.max(analyticsClicks, bannerStoredClicks),
      uniqueVisitors: analyticsOverview[0]?.uniqueIps?.length || 0,
      totalProducts,
      totalUsers,
    };

    // Get top products by views from analytics (real-time)
    const topProductsFromAnalytics = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType: "product",
          eventType: "product_view",
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: "$entityId",
          views: { $sum: 1 },
          entityName: { $first: "$entityName" },
          uniqueIps: { $addToSet: "$ip" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 5 },
    ]);

    const maxViews = topProductsFromAnalytics[0]?.views || 1;
    const topProductsWithPercentage = topProductsFromAnalytics.map((p: any) => ({
      id: p._id,
      name: p.entityName || "Unknown",
      views: p.views || 0,
      uniqueVisitors: p.uniqueIps?.length || 0,
      percentage: Math.round(((p.views || 0) / maxViews) * 100),
    }));

    // Get all active categories with their product counts and total product views
    const allCategories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          let: { categoryId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$category", "$$categoryId"] }, isActive: true } },
          ],
          as: "products",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          slug: 1,
          productCount: { $size: "$products" },
          totalProductViews: { $sum: "$products.totalViews" },
        },
      },
    ]);

    // Get category views from analytics events
    const categoryViews = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType: "category",
          eventType: "category_view",
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: "$entityId",
          views: { $sum: 1 },
        },
      },
    ]);

    // Create a map of category views by ID
    const categoryViewsMap = new Map<string, number>();
    for (const cv of categoryViews) {
      if (cv._id) {
        categoryViewsMap.set(cv._id, cv.views || 0);
      }
    }

    // Merge category data with views and sort
    const topCategories = allCategories
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat.productCount || 0,
        views: categoryViewsMap.get(cat.id) || 0,
        totalProductViews: cat.totalProductViews || 0,
      }))
      .sort((a: any, b: any) => {
        // Sort by views first, then by product count, then by total product views
        if (b.views !== a.views) return b.views - a.views;
        if (b.productCount !== a.productCount) return b.productCount - a.productCount;
        return b.totalProductViews - a.totalProductViews;
      })
      .slice(0, 10); // Show top 10 categories

    // Get banner stats with analytics data - show all banners
    const [bannerStats, bannerAnalytics] = await Promise.all([
      HeroBanner.find({ isActive: true })
        .select("id name impressions clicks")
        .sort({ impressions: -1 })
        .lean(),
      AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "banner",
            ...dateMatch,
          },
        },
        {
          $group: {
            _id: "$entityId",
            impressions: {
              $sum: { $cond: [{ $eq: ["$eventType", "banner_impression"] }, 1, 0] },
            },
            clicks: {
              $sum: { $cond: [{ $eq: ["$eventType", "banner_click"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    // Merge banner data - create map with both _id formats for matching
    const bannerAnalyticsMap = new Map<string, any>();
    bannerAnalytics.forEach((b: any) => {
      bannerAnalyticsMap.set(b._id, b);
    });

    const bannerStatsWithCTR = bannerStats.map((b: any) => {
      const bannerId = b.id || b._id?.toString();
      // Try to find analytics data by matching the banner ID
      const analytics = bannerAnalyticsMap.get(bannerId) || {};
      // Use analytics data if available, otherwise fall back to stored counts
      // Also add the stored clicks/impressions as they may be from direct database updates
      const analyticsImpressions = (analytics as any).impressions || 0;
      const analyticsClicks = (analytics as any).clicks || 0;
      const storedImpressions = b.impressions || 0;
      const storedClicks = b.clicks || 0;

      // Use whichever is higher - analytics events or stored values
      const impressions = Math.max(analyticsImpressions, storedImpressions);
      const clicks = Math.max(analyticsClicks, storedClicks);

      return {
        id: bannerId,
        name: b.name,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    });

    // Calculate total banner clicks for consistency check
    const totalBannerClicks = bannerStatsWithCTR.reduce((sum, b) => sum + b.clicks, 0);

    // Get tag stats with analytics data
    const [tagStats, tagAnalytics] = await Promise.all([
      Tag.find({ isActive: true })
        .select("id name slug clicks")
        .sort({ clicks: -1 })
        .limit(10)
        .lean(),
      AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "tag",
            eventType: "tag_click",
            ...dateMatch,
          },
        },
        {
          $group: {
            _id: "$entityId",
            clicks: { $sum: 1 },
            entityName: { $first: "$entityName" },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Create map of analytics data
    const tagAnalyticsMap = new Map<string, any>();
    tagAnalytics.forEach((t: any) => {
      tagAnalyticsMap.set(t._id, t);
    });

    const tagStatsWithAnalytics = tagStats.map((t: any) => {
      const tagId = t.id || t._id?.toString();
      const analytics = tagAnalyticsMap.get(tagId) || {};
      const analyticsClicks = (analytics as any).clicks || 0;
      const storedClicks = t.clicks || 0;

      return {
        id: tagId,
        name: t.name,
        slug: t.slug,
        clicks: Math.max(analyticsClicks, storedClicks),
      };
    });

    // Sort by clicks descending
    tagStatsWithAnalytics.sort((a, b) => b.clicks - a.clicks);
    const totalTagClicks = tagStatsWithAnalytics.reduce((sum, t) => sum + t.clicks, 0);

    // Get daily trends for charts - aggregate from AnalyticsEvent directly
    const dailyTrends = await AnalyticsEvent.aggregate([
      {
        $match: dateMatch,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: {
            $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /view/ } }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /click/ } }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // Get entity type breakdown for pie chart
    const entityBreakdown = await AnalyticsEvent.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$entityType",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...overview,
          totalBannerClicks,
          totalTagClicks,
        },
        topProducts: topProductsWithPercentage,
        topCategories,
        bannerStats: bannerStatsWithCTR,
        tagStats: tagStatsWithAnalytics,
        dailyTrends: dailyTrends.map((d: any) => ({
          date: d._id,
          views: d.views,
          clicks: d.clicks,
        })),
        entityBreakdown: entityBreakdown.map((e: any) => ({
          name: e._id,
          value: e.count,
        })),
      },
    });
  } catch (error) {
    console.error("Admin Analytics GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
