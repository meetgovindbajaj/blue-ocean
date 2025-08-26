import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

export interface QueryFilter {
  isActive: boolean;
  category?: string;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
}

// Cache headers for better performance
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const page = searchParams.get("page") || "1";

    // Input validation
    const limitNum = limit ? Math.min(Math.max(parseInt(limit), 1), 100) : 20;
    const pageNum = Math.max(parseInt(page), 1);
    const skip = (pageNum - 1) * limitNum;

    const query: QueryFilter = { isActive: true };

    // Filter by category if provided
    if (category && category.trim()) {
      query.category = category.trim();
    }

    // Search functionality with better sanitization
    if (search && search.trim()) {
      const sanitizedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);

    let productQuery = Product.find(query)
      .select(
        "id name slug description prices images category isActive createdAt updatedAt size"
      )
      .populate("category", "id name slug")
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    // Apply sorting with validation
    const validSorts = ["name", "price-low", "price-high", "newest"];
    const sortOption = validSorts.includes(sort || "") ? sort : "newest";

    switch (sortOption) {
      case "name":
        productQuery = productQuery.sort({ name: 1 });
        break;
      case "price-low":
        productQuery = productQuery.sort({ "prices.retail": 1 });
        break;
      case "price-high":
        productQuery = productQuery.sort({ "prices.retail": -1 });
        break;
      case "newest":
      default:
        productQuery = productQuery.sort({ createdAt: -1 });
        break;
    }

    const products = await productQuery;

    const response = NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
      filters: {
        category,
        search,
        sort: sortOption,
        limit: limitNum,
      },
    });

    // Set cache headers
    Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Products API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
