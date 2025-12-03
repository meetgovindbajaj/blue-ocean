import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import HeroBanner from "@/models/HeroBanner";

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

    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    switch (type) {
      case "products":
        headers = ["ID", "Name", "Slug", "Category", "Retail Price", "Wholesale Price", "Discount %", "Views", "Clicks", "Active", "Created At"];
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
          views: p.views || 0,
          clicks: p.clicks || 0,
          active: p.isActive ? "Yes" : "No",
          createdAt: p.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "products-report";
        break;

      case "categories":
        headers = ["ID", "Name", "Slug", "Parent", "Description", "Active", "Created At"];
        const categories = await Category.find(dateFilter)
          .populate("parent", "name")
          .sort({ name: 1 })
          .lean();
        data = categories.map((c: any) => ({
          id: c.id || c._id?.toString(),
          name: c.name,
          slug: c.slug,
          parent: c.parent?.name || "",
          description: c.description || "",
          active: c.isActive ? "Yes" : "No",
          createdAt: c.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "categories-report";
        break;

      case "users":
        headers = ["ID", "Name", "Email", "Role", "Status", "Verified", "Last Login", "Created At"];
        const users = await User.find(dateFilter)
          .sort({ createdAt: -1 })
          .lean();
        data = users.map((u: any) => ({
          id: u.id || u._id?.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          verified: u.isVerified ? "Yes" : "No",
          lastLogin: u.lastLogin?.toISOString().split("T")[0] || "",
          createdAt: u.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "users-report";
        break;

      case "banners":
        headers = ["ID", "Name", "Content Type", "Order", "Impressions", "Clicks", "CTR %", "Active", "Created At"];
        const banners = await HeroBanner.find(dateFilter)
          .sort({ order: 1 })
          .lean();
        data = banners.map((b: any) => ({
          id: b.id || b._id?.toString(),
          name: b.name,
          contentType: b.contentType,
          order: b.order,
          impressions: b.impressions || 0,
          clicks: b.clicks || 0,
          ctr: b.impressions > 0 ? (((b.clicks || 0) / b.impressions) * 100).toFixed(2) : "0.00",
          active: b.isActive ? "Yes" : "No",
          createdAt: b.createdAt?.toISOString().split("T")[0] || "",
        }));
        filename = "banners-report";
        break;

      case "analytics":
        headers = ["Metric", "Value"];
        const [totalProducts, totalCategories, totalUsers, totalBanners] = await Promise.all([
          Product.countDocuments(),
          Category.countDocuments(),
          User.countDocuments(),
          HeroBanner.countDocuments(),
        ]);
        const productStats = await Product.aggregate([
          {
            $group: {
              _id: null,
              totalViews: { $sum: { $ifNull: ["$views", 0] } },
              totalClicks: { $sum: { $ifNull: ["$clicks", 0] } },
            },
          },
        ]);
        data = [
          { metric: "Total Products", value: totalProducts },
          { metric: "Total Categories", value: totalCategories },
          { metric: "Total Users", value: totalUsers },
          { metric: "Total Banners", value: totalBanners },
          { metric: "Total Product Views", value: productStats[0]?.totalViews || 0 },
          { metric: "Total Product Clicks", value: productStats[0]?.totalClicks || 0 },
        ];
        filename = "analytics-report";
        break;

      case "orders":
        // Placeholder for orders - would need Order model
        headers = ["Order ID", "Customer", "Total", "Status", "Created At"];
        data = [];
        filename = "orders-report";
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }

    if (format === "json") {
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
