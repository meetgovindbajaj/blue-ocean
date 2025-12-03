import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import HeroBanner from "@/models/HeroBanner";
import { AnalyticsEvent } from "@/models/Analytics";

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
    const [totalProducts, totalUsers, analyticsOverview] = await Promise.all([
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
    ]);

    const overview = {
      totalViews: analyticsOverview[0]?.totalViews || 0,
      totalClicks: analyticsOverview[0]?.totalClicks || 0,
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

    // Get categories with views from analytics
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
          entityName: { $first: "$entityName" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 5 },
    ]);

    // Get category product counts
    const categoryProductCounts = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          productCount: { $size: "$products" },
        },
      },
    ]);

    // Merge category data
    const categoryMap = new Map(
      categoryProductCounts.map((c: any) => [c.id, c])
    );

    const topCategories = categoryViews.map((cv: any) => {
      const catInfo = categoryMap.get(cv._id) || {};
      return {
        id: cv._id,
        name: cv.entityName || (catInfo as any).name || "Unknown",
        productCount: (catInfo as any).productCount || 0,
        views: cv.views || 0,
      };
    });

    // If no category views, show categories by product count
    if (topCategories.length === 0) {
      const fallbackCategories = await Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "category",
            as: "products",
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            name: 1,
            productCount: { $size: "$products" },
            views: { $sum: "$products.totalViews" },
          },
        },
        { $sort: { productCount: -1 } },
        { $limit: 5 },
      ]);
      topCategories.push(...fallbackCategories);
    }

    // Get banner stats with analytics data
    const [bannerStats, bannerAnalytics] = await Promise.all([
      HeroBanner.find({ isActive: true })
        .select("id name impressions clicks")
        .sort({ impressions: -1 })
        .limit(6)
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

    // Merge banner data
    const bannerAnalyticsMap = new Map(
      bannerAnalytics.map((b: any) => [b._id, b])
    );

    const bannerStatsWithCTR = bannerStats.map((b: any) => {
      const analytics = bannerAnalyticsMap.get(b._id?.toString()) || {};
      const impressions = (analytics as any).impressions || b.impressions || 0;
      const clicks = (analytics as any).clicks || b.clicks || 0;
      return {
        id: b.id || b._id?.toString(),
        name: b.name,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        overview,
        topProducts: topProductsWithPercentage,
        topCategories,
        bannerStats: bannerStatsWithCTR,
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
