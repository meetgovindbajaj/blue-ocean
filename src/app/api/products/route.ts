import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";

export const dynamic = "force-dynamic";

interface QueryFilter {
  isActive: boolean;
  category?: Types.ObjectId | { $in: Types.ObjectId[] };
  "prices.retail"?: { $gte?: number; $lte?: number };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
}

type SortOption = "name" | "price-low" | "price-high" | "newest" | "trending";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

const VALID_SORTS: SortOption[] = ["name", "price-low", "price-high", "newest", "trending"];

const SORT_MAP: Record<SortOption, Record<string, 1 | -1>> = {
  name: { name: 1 },
  "price-low": { "prices.retail": 1 },
  "price-high": { "prices.retail": -1 },
  trending: { score: -1, createdAt: -1 },
  newest: { createdAt: -1 },
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const limitNum = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const pageNum = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const query: QueryFilter = { isActive: true };

    // Category filter (id, slug, or name - includes children)
    if (category?.trim()) {
      const trimmed = category.trim();

      if (mongoose.isValidObjectId(trimmed)) {
        query.category = new Types.ObjectId(trimmed);
      } else {
        // Try slug first, then name (case-insensitive)
        const baseCategory = await Category.findOne({
          $or: [{ slug: trimmed }, { name: { $regex: `^${trimmed}$`, $options: "i" } }],
          isActive: true,
        })
          .select("_id children")
          .lean();

        if (!baseCategory) {
          return NextResponse.json(
            {
              success: true,
              products: [],
              pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 },
              filters: { category, search, sort: "newest", minPrice, maxPrice },
            },
            { headers: CACHE_HEADERS }
          );
        }

        const categoryIds: Types.ObjectId[] = [baseCategory._id];
        if (baseCategory.children?.length) {
          categoryIds.push(...baseCategory.children);
        }

        query.category = { $in: categoryIds };
      }
    }

    // Search filter
    if (search?.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    // Price filter
    const minPriceNum = minPrice ? Number(minPrice) : null;
    const maxPriceNum = maxPrice ? Number(maxPrice) : null;

    if (minPriceNum !== null || maxPriceNum !== null) {
      query["prices.retail"] = {
        ...(minPriceNum !== null && { $gte: minPriceNum }),
        ...(maxPriceNum !== null && { $lte: maxPriceNum }),
      };
    }

    // Sorting
    const sortOption: SortOption = VALID_SORTS.includes(sort as SortOption)
      ? (sort as SortOption)
      : "newest";

    const [totalCount, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select("id name slug description prices images category isActive createdAt size score totalViews")
        .populate("category", "id name slug")
        .sort(SORT_MAP[sortOption])
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return NextResponse.json(
      {
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
          minPrice: minPriceNum,
          maxPrice: maxPriceNum,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Products API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
