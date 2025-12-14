import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import HeroBanner from "@/models/HeroBanner";
import Inquiry from "@/models/Inquiry";
import { UserStatus } from "@/lib/properties";
import { AnalyticsEvent, DailyAnalytics } from "@/models/Analytics";

export async function GET() {
  try {
    await connectDB();

    // Time ranges
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    // Last 14 days for chart
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 14);
    twoWeeksAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      totalCategories,
      activeCategories,
      totalUsers,
      activeUsers,
      totalBanners,
      activeBanners,
      totalInquiries,
      pendingInquiries,
      recentProducts,
      topProducts,
      viewsToday,
      viewsThisWeek,
      topViewedFromAnalytics,
      dailyTrends,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ status: UserStatus.ACTIVE }),
      HeroBanner.countDocuments(),
      HeroBanner.countDocuments({ isActive: true }),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: "pending" }),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("id name prices.retail totalViews score")
        .lean(),
      Product.find()
        .sort({ score: -1, totalViews: -1 })
        .limit(5)
        .select("id name totalViews score")
        .lean(),
      // Views today from analytics
      AnalyticsEvent.countDocuments({
        eventType: "product_view",
        createdAt: { $gte: todayStart },
      }),
      // Views this week from analytics
      AnalyticsEvent.countDocuments({
        eventType: "product_view",
        createdAt: { $gte: weekStart },
      }),
      // Top viewed products from analytics (real-time)
      AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "product",
            eventType: "product_view",
            createdAt: { $gte: weekStart },
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
        {
          $addFields: {
            uniqueVisitors: { $size: "$uniqueIps" },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
      // Daily trends for chart (last 14 days)
      AnalyticsEvent.aggregate([
        {
          $match: {
            createdAt: { $gte: twoWeeksAgo },
          },
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
            uniqueIps: { $addToSet: "$ip" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        products: { total: totalProducts, active: activeProducts },
        categories: { total: totalCategories, active: activeCategories },
        users: { total: totalUsers, active: activeUsers },
        banners: { total: totalBanners, active: activeBanners },
        inquiries: { total: totalInquiries, pending: pendingInquiries },
        analytics: {
          viewsToday,
          viewsThisWeek,
        },
        recentProducts: recentProducts.map((p: any) => ({
          id: p.id || p._id?.toString(),
          name: p.name,
          price: p.prices?.retail || 0,
          views: p.totalViews || 0,
          score: p.score || 0,
        })),
        topProducts: topProducts.map((p: any) => ({
          id: p.id || p._id?.toString(),
          name: p.name,
          views: p.totalViews || 0,
          score: p.score || 0,
        })),
        topViewedThisWeek: topViewedFromAnalytics.map((p: any) => ({
          id: p._id,
          name: p.entityName || "Unknown",
          views: p.views || 0,
          uniqueVisitors: p.uniqueVisitors || 0,
        })),
        dailyTrends: dailyTrends.map((d: any) => ({
          date: d._id,
          views: d.views || 0,
          clicks: d.clicks || 0,
          uniqueVisitors: d.uniqueIps?.length || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
