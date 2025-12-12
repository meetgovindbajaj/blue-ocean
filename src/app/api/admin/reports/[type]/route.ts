import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import Profile from "@/models/Profile";
import HeroBanner from "@/models/HeroBanner";
import Tag from "@/models/Tag";
import Inquiry from "@/models/Inquiry";
import { AnalyticsEvent, DailyAnalytics } from "@/models/Analytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await connectDB();
    const { type } = await params;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const range = searchParams.get("range") || "30d";
    const preview = searchParams.get("preview") === "true";
    const limit = parseInt(searchParams.get("limit") || "0") || 0;
    const filter = searchParams.get("filter") || "all"; // "all" = all entries, "new" = only new entries in date range

    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "365d":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null;
    }

    // Only apply date filter when filter=new (new entries only)
    // When filter=all, show all entries regardless of date range
    const dateFilter = (filter === "new" && startDate) ? { createdAt: { $gte: startDate } } : {};

    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    switch (type) {
      case "products":
        headers = [
          "ID", "Name", "Slug", "Category", "Retail Price", "Wholesale Price",
          "Discount %", "Effective Price", "Length", "Width", "Height", "Size Unit",
          "Images Count", "Views", "Score", "Active", "Created At", "Updated At"
        ];
        const products = await Product.find(dateFilter)
          .populate("category", "name")
          .sort({ createdAt: -1 })
          .lean();
        data = products.map((p: any) => ({
          id: p.id || p._id?.toString(),
          name: p.name,
          slug: p.slug,
          category: p.category?.name || "",
          retailPrice: p.prices?.retail || 0,
          wholesalePrice: p.prices?.wholesale || 0,
          discount: p.prices?.discount || 0,
          effectivePrice: p.prices?.effectivePrice || p.prices?.retail || 0,
          length: p.size?.length || 0,
          width: p.size?.width || 0,
          height: p.size?.height || 0,
          sizeUnit: p.size?.unit || "cm",
          imagesCount: p.images?.length || 0,
          views: p.totalViews || 0,
          score: p.score || 0,
          active: p.isActive ? "Yes" : "No",
          createdAt: p.createdAt?.toISOString().split("T")[0] || "",
          updatedAt: p.updatedAt?.toISOString().split("T")[0] || "",
        }));
        filename = "products-report";
        break;

      case "categories":
        headers = [
          "ID", "Name", "Slug", "Parent", "Description", "Product Count",
          "Active Products", "Total Views", "Unique Visitors", "Active", "Created At", "Updated At"
        ];
        const categories = await Category.find(dateFilter)
          .populate("parent", "name")
          .sort({ name: 1 })
          .lean();
        // Get product counts per category
        const productCounts = await Product.aggregate([
          { $group: { _id: "$category", total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }
        ]);
        const countMap = new Map(productCounts.map((p: any) => [p._id?.toString(), { total: p.total, active: p.active }]));
        // Get category views from analytics
        const categoryViews = await DailyAnalytics.aggregate([
          { $match: { entityType: "category" } },
          { $group: { _id: "$entityId", totalViews: { $sum: "$views" }, uniqueIps: { $sum: "$uniqueIps" } } }
        ]);
        const viewsMap = new Map(categoryViews.map((v: any) => [v._id, { views: v.totalViews, uniqueIps: v.uniqueIps }]));
        data = categories.map((c: any) => {
          const counts = countMap.get(c._id?.toString()) || { total: 0, active: 0 };
          const views = viewsMap.get(c.id || c._id?.toString()) || { views: 0, uniqueIps: 0 };
          return {
            id: c.id || c._id?.toString(),
            name: c.name,
            slug: c.slug,
            parent: c.parent?.name || "",
            description: c.description || "",
            productCount: counts.total,
            activeProducts: counts.active,
            totalViews: views.views,
            uniqueVisitors: views.uniqueIps,
            active: c.isActive ? "Yes" : "No",
            createdAt: c.createdAt?.toISOString().split("T")[0] || "",
            updatedAt: c.updatedAt?.toISOString().split("T")[0] || "",
          };
        });
        filename = "categories-report";
        break;

      case "users":
        headers = [
          "ID", "Name", "Email", "Role", "Status", "Verified", "2FA Enabled",
          "Phone", "City", "Country", "Email Notifications", "Wishlist Count",
          "Last Login", "Created At"
        ];
        const users = await User.find(dateFilter)
          .populate("profile")
          .sort({ createdAt: -1 })
          .lean();
        data = users.map((u: any) => ({
          id: u.id || u._id?.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          verified: u.isVerified ? "Yes" : "No",
          twoFactorEnabled: u.twoFactorEnabled ? "Yes" : "No",
          phone: u.profile?.phone || "",
          city: u.profile?.address?.city || "",
          country: u.profile?.address?.country || "",
          emailNotifications: u.profile?.preferences?.notifications?.email ? "Yes" : "No",
          wishlistCount: u.profile?.wishlist?.length || 0,
          lastLogin: u.lastLogin?.toISOString().split("T")[0] || "",
          createdAt: u.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "users-report";
        break;

      case "banners":
        headers = [
          "ID", "Name", "Title", "Subtitle", "Content Type", "Link URL", "Order",
          "Impressions", "Clicks", "CTR %", "Active", "Created At", "Updated At"
        ];
        const banners = await HeroBanner.find(dateFilter)
          .sort({ order: 1 })
          .lean();
        data = banners.map((b: any) => ({
          id: b.id || b._id?.toString(),
          name: b.name,
          title: b.title || "",
          subtitle: b.subtitle || "",
          contentType: b.contentType,
          linkUrl: b.linkUrl || "",
          order: b.order,
          impressions: b.impressions || 0,
          clicks: b.clicks || 0,
          ctr: b.impressions > 0 ? (((b.clicks || 0) / b.impressions) * 100).toFixed(2) : "0.00",
          active: b.isActive ? "Yes" : "No",
          createdAt: b.createdAt?.toISOString().split("T")[0] || "",
          updatedAt: b.updatedAt?.toISOString().split("T")[0] || "",
        }));
        filename = "banners-report";
        break;

      case "analytics":
        headers = ["Category", "Metric", "Value", "Details"];
        // Calculate date filter for analytics
        const analyticsDateFilter = startDate ? { createdAt: { $gte: startDate } } : {};
        const analyticsEventDateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

        const [
          totalProducts, activeProducts, totalCategories, activeCategories,
          totalUsers, verifiedUsers, totalBanners, activeBanners,
          totalTags, activeTags, totalInquiries, pendingInquiries
        ] = await Promise.all([
          Product.countDocuments(),
          Product.countDocuments({ isActive: true }),
          Category.countDocuments(),
          Category.countDocuments({ isActive: true }),
          User.countDocuments(),
          User.countDocuments({ isVerified: true }),
          HeroBanner.countDocuments(),
          HeroBanner.countDocuments({ isActive: true }),
          Tag.countDocuments(),
          Tag.countDocuments({ isActive: true }),
          Inquiry.countDocuments(),
          Inquiry.countDocuments({ status: "pending" }),
        ]);

        // New entries in date range
        const [newProducts, newUsers, newInquiries] = await Promise.all([
          Product.countDocuments(analyticsDateFilter),
          User.countDocuments(analyticsDateFilter),
          Inquiry.countDocuments(analyticsDateFilter),
        ]);

        const productStats = await Product.aggregate([
          {
            $group: {
              _id: null,
              totalViews: { $sum: { $ifNull: ["$totalViews", 0] } },
              avgPrice: { $avg: "$prices.retail" },
              maxPrice: { $max: "$prices.retail" },
              minPrice: { $min: "$prices.retail" },
              avgDiscount: { $avg: "$prices.discount" },
            },
          },
        ]);
        const tagStats = await Tag.aggregate([
          {
            $group: {
              _id: null,
              totalClicks: { $sum: { $ifNull: ["$clicks", 0] } },
            },
          },
        ]);
        const bannerStats = await HeroBanner.aggregate([
          {
            $group: {
              _id: null,
              totalImpressions: { $sum: { $ifNull: ["$impressions", 0] } },
              totalClicks: { $sum: { $ifNull: ["$clicks", 0] } },
            },
          },
        ]);

        // User stats
        const usersByRole = await User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        const roleBreakdown = usersByRole.map((r: any) => `${r._id}: ${r.count}`).join(", ");

        // Inquiry stats by status
        const inquiriesByStatus = await Inquiry.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const inquiryBreakdown = inquiriesByStatus.map((i: any) => `${i._id}: ${i.count}`).join(", ");

        // Email subscribers count
        const emailSubscribers = await Profile.countDocuments({ "preferences.notifications.email": true });

        const bannerCTR = bannerStats[0]?.totalImpressions > 0
          ? ((bannerStats[0]?.totalClicks / bannerStats[0]?.totalImpressions) * 100).toFixed(2)
          : "0.00";

        // Analytics from AnalyticsEvent model
        const [
          totalPageViews, totalProductViews, totalCategoryViews,
          totalSearches, totalContactSubmits, uniqueSessions, uniqueVisitors
        ] = await Promise.all([
          AnalyticsEvent.countDocuments({ eventType: "page_view", ...analyticsEventDateFilter }),
          AnalyticsEvent.countDocuments({ eventType: "product_view", ...analyticsEventDateFilter }),
          AnalyticsEvent.countDocuments({ eventType: "category_view", ...analyticsEventDateFilter }),
          AnalyticsEvent.countDocuments({ eventType: "search", ...analyticsEventDateFilter }),
          AnalyticsEvent.countDocuments({ eventType: "contact_submit", ...analyticsEventDateFilter }),
          AnalyticsEvent.distinct("sessionId", analyticsEventDateFilter).then(r => r.length),
          AnalyticsEvent.distinct("ip", analyticsEventDateFilter).then(r => r.length),
        ]);

        // Top viewed products
        const topProducts = await DailyAnalytics.aggregate([
          { $match: { entityType: "product" } },
          { $group: { _id: "$entityName", views: { $sum: "$views" } } },
          { $sort: { views: -1 } },
          { $limit: 5 }
        ]);
        const topProductsList = topProducts.map((p: any, i: number) => `${i + 1}. ${p._id || "Unknown"} (${p.views})`).join(", ");

        // Top viewed categories
        const topCategories = await DailyAnalytics.aggregate([
          { $match: { entityType: "category" } },
          { $group: { _id: "$entityName", views: { $sum: "$views" } } },
          { $sort: { views: -1 } },
          { $limit: 5 }
        ]);
        const topCategoriesList = topCategories.map((c: any, i: number) => `${i + 1}. ${c._id || "Unknown"} (${c.views})`).join(", ");

        // Search queries
        const topSearches = await AnalyticsEvent.aggregate([
          { $match: { eventType: "search", "metadata.searchQuery": { $exists: true, $ne: "" }, ...analyticsEventDateFilter } },
          { $group: { _id: "$metadata.searchQuery", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]);
        const topSearchesList = topSearches.map((s: any, i: number) => `${i + 1}. "${s._id}" (${s.count})`).join(", ");

        // Device breakdown
        const deviceStats = await AnalyticsEvent.aggregate([
          { $match: { "metadata.device": { $exists: true }, ...analyticsEventDateFilter } },
          { $group: { _id: "$metadata.device", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        const deviceBreakdown = deviceStats.map((d: any) => `${d._id || "Unknown"}: ${d.count}`).join(", ");

        data = [
          // Overview
          { category: "Overview", metric: "Total Page Views", value: totalPageViews, details: `Range: ${range}` },
          { category: "Overview", metric: "Unique Sessions", value: uniqueSessions, details: `Range: ${range}` },
          { category: "Overview", metric: "Unique Visitors (IPs)", value: uniqueVisitors, details: `Range: ${range}` },
          { category: "Overview", metric: "Device Breakdown", value: deviceStats.length, details: deviceBreakdown || "No data" },

          // Products
          { category: "Products", metric: "Total Products", value: totalProducts, details: `Active: ${activeProducts}` },
          { category: "Products", metric: "New Products (in range)", value: newProducts, details: `Range: ${range}` },
          { category: "Products", metric: "Product Page Views", value: totalProductViews, details: `Range: ${range}` },
          { category: "Products", metric: "Product Views (cumulative)", value: productStats[0]?.totalViews || 0, details: "From product model" },
          { category: "Products", metric: "Top Viewed Products", value: topProducts.length, details: topProductsList || "No data" },
          { category: "Products", metric: "Average Price", value: `$${(productStats[0]?.avgPrice || 0).toFixed(2)}`, details: `Min: $${productStats[0]?.minPrice || 0}, Max: $${productStats[0]?.maxPrice || 0}` },
          { category: "Products", metric: "Average Discount", value: `${(productStats[0]?.avgDiscount || 0).toFixed(1)}%`, details: "" },

          // Categories
          { category: "Categories", metric: "Total Categories", value: totalCategories, details: `Active: ${activeCategories}` },
          { category: "Categories", metric: "Category Page Views", value: totalCategoryViews, details: `Range: ${range}` },
          { category: "Categories", metric: "Top Viewed Categories", value: topCategories.length, details: topCategoriesList || "No data" },

          // Users
          { category: "Users", metric: "Total Users", value: totalUsers, details: `Verified: ${verifiedUsers}` },
          { category: "Users", metric: "New Users (in range)", value: newUsers, details: `Range: ${range}` },
          { category: "Users", metric: "Users by Role", value: totalUsers, details: roleBreakdown },
          { category: "Users", metric: "Email Subscribers", value: emailSubscribers, details: "Users with email notifications enabled" },

          // Inquiries
          { category: "Inquiries", metric: "Total Inquiries", value: totalInquiries, details: `Pending: ${pendingInquiries}` },
          { category: "Inquiries", metric: "New Inquiries (in range)", value: newInquiries, details: `Range: ${range}` },
          { category: "Inquiries", metric: "Inquiries by Status", value: totalInquiries, details: inquiryBreakdown },
          { category: "Inquiries", metric: "Contact Form Submissions", value: totalContactSubmits, details: `Range: ${range}` },

          // Search
          { category: "Search", metric: "Total Searches", value: totalSearches, details: `Range: ${range}` },
          { category: "Search", metric: "Top Search Queries", value: topSearches.length, details: topSearchesList || "No searches" },

          // Banners
          { category: "Banners", metric: "Total Banners", value: totalBanners, details: `Active: ${activeBanners}` },
          { category: "Banners", metric: "Banner Impressions", value: bannerStats[0]?.totalImpressions || 0, details: "" },
          { category: "Banners", metric: "Banner Clicks", value: bannerStats[0]?.totalClicks || 0, details: "" },
          { category: "Banners", metric: "Banner CTR", value: `${bannerCTR}%`, details: "" },

          // Tags
          { category: "Tags", metric: "Total Tags", value: totalTags, details: `Active: ${activeTags}` },
          { category: "Tags", metric: "Total Tag Clicks", value: tagStats[0]?.totalClicks || 0, details: "" },
        ];
        filename = "analytics-report";
        break;

      case "tags":
        headers = ["ID", "Name", "Slug", "Website", "Clicks", "Active", "Created At"];
        const tags = await Tag.find(dateFilter)
          .sort({ clicks: -1 })
          .lean();
        data = tags.map((t: any) => ({
          id: t.id || t._id?.toString(),
          name: t.name,
          slug: t.slug,
          website: t.website || "",
          clicks: t.clicks || 0,
          active: t.isActive ? "Yes" : "No",
          createdAt: t.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "tags-report";
        break;

      case "inquiries":
        headers = [
          "ID", "Customer Name", "Email", "Phone", "Product", "Status", "Priority",
          "Message", "Notes Count", "Created At", "Updated At"
        ];
        const inquiries = await Inquiry.find(dateFilter)
          .populate("productId", "name slug")
          .populate("assignedTo", "name")
          .sort({ createdAt: -1 })
          .lean();
        data = inquiries.map((i: any) => ({
          id: i._id?.toString(),
          customerName: i.name,
          email: i.email,
          phone: i.phone || "",
          product: i.productId?.name || "General Inquiry",
          status: i.status,
          priority: i.priority,
          message: i.message?.substring(0, 200) + (i.message?.length > 200 ? "..." : ""),
          notesCount: i.notes?.length || 0,
          createdAt: i.createdAt?.toISOString().split("T")[0] || "",
          updatedAt: i.updatedAt?.toISOString().split("T")[0] || "",
        }));
        filename = "inquiries-report";
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }

    // For preview mode, return structured response
    if (preview || format === "json") {
      const totalCount = data.length;
      const responseData = limit > 0 ? data.slice(0, limit) : data;

      if (preview) {
        return NextResponse.json({
          success: true,
          data: responseData,
          total: totalCount,
        });
      }

      // Regular JSON download
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.json"`,
          "Content-Type": "application/json",
        },
      });
    }

    if (format === "csv") {
      const csvRows = [headers.join(",")];
      data.forEach((row) => {
        const values = Object.values(row).map((val) => {
          const str = String(val);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(values.join(","));
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
          "Content-Type": "text/csv",
        },
      });
    }

    // For xlsx, return as JSON with xlsx content type (client would need xlsx library)
    // Simple implementation - return as CSV for now
    const csvRows = [headers.join(",")];
    data.forEach((row) => {
      const values = Object.values(row).map((val) => {
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(","));
    });

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Content-Type": "text/csv",
      },
    });
  } catch (error) {
    console.error("Admin Reports GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
