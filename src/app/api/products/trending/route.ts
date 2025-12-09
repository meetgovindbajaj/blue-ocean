import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

type TrendingPeriod = "day" | "week" | "month" | "all";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const period = (searchParams.get("period") || "week") as TrendingPeriod;
    const categorySlug = searchParams.get("category");
    const excludeIds =
      searchParams.get("exclude")?.split(",").filter(Boolean) || [];
    const featured = searchParams.get("featured") === "true";

    const excludeObjectIds = excludeIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new Types.ObjectId(id));

    // ────────────────────────────────
    // Category filter (slug + its children)
    // ────────────────────────────────
    let categoryFilter: Types.ObjectId[] = [];

    if (categorySlug) {
      const baseCategory = await Category.findOne({
        slug: categorySlug,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (baseCategory) {
        const relatedCategories = await Category.find({
          $or: [{ _id: baseCategory._id }, { parent: baseCategory._id }],
          isActive: true,
        })
          .select("_id")
          .lean();

        categoryFilter = relatedCategories.map((c: any) => c._id);
      } else {
        // invalid category slug → no products
        return NextResponse.json({
          success: true,
          data: {
            products: [],
            meta: {
              total: 0,
              strategy: "none",
              period,
              category: categorySlug,
              limit,
            },
          },
        });
      }
    }

    // ────────────────────────────────
    // Build Product query using score
    // ────────────────────────────────
    const query: any = {
      isActive: true,
    };

    if (categoryFilter.length > 0) {
      query.category = { $in: categoryFilter };
    }

    if (excludeObjectIds.length > 0) {
      query._id = { $nin: excludeObjectIds };
    }

    // Highest score first; newest as secondary sort
    let trendingProducts = await Product.find(query)
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .populate("category", "name slug id")
      .lean();

    let strategy: "trending" | "latest" = "trending";

    // Fallback: if everything is score 0, treat as latest
    if (!trendingProducts.length) {
      strategy = "latest";
      trendingProducts = await Product.find({
        isActive: true,
        ...(categoryFilter.length ? { category: { $in: categoryFilter } } : {}),
        ...(excludeObjectIds.length ? { _id: { $nin: excludeObjectIds } } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("category", "name slug id")
        .lean();
    }

    const transformed = trendingProducts.map((product: any, index: number) => ({
      id: product.id || product._id?.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      prices: product.prices,
      size: product.size,
      category: product.category
        ? {
            id: product.category.id || product.category._id?.toString(),
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      thumbnail:
        product.images?.find((img: any) => img.isThumbnail) ||
        product.images?.[0] ||
        null,
      images: featured ? product.images : undefined,
      isActive: product.isActive,
      stats: {
        rank: index + 1,
        score: product.score || 0,
        totalViews: product.totalViews || 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: transformed,
        meta: {
          total: transformed.length,
          strategy,
          period,
          category: categorySlug || null,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Trending Products API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trending products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
