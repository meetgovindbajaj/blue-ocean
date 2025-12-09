import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Profile from "@/models/Profile";
import Category from "@/models/Category";
import { AnalyticsEvent } from "@/models/Analytics";
import User from "@/models/User"; // 👈 Auth user model, which has profile ref

interface RecommendationQuery {
  userId?: string;
  limit?: number;
  excludeProductIds?: string[];
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
    const excludeIds =
      searchParams.get("exclude")?.split(",").filter(Boolean) || [];

    const excludeObjectIds = excludeIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new Types.ObjectId(id));

    let recommendations: any[] = [];
    let strategy: "fallback" | "personalized" | "popular" | "latest" =
      "fallback";

    // ─────────────────────────────────────────
    // Strategy 1: Personalized (logged-in users)
    // ─────────────────────────────────────────
    if (userId && mongoose.isValidObjectId(userId)) {
      const userObjectId = new Types.ObjectId(userId);

      // 1) Load user → get profile id
      const user = await User.findById(userObjectId).select("profile").lean();

      const profileId = user?.profile as Types.ObjectId | undefined;

      // 2) In parallel: profile (if exists) + telemetry (AnalyticsEvent by userId)
      let profile: any = null;
      let viewHistory: any[] = [];

      if (profileId) {
        [profile, viewHistory] = await Promise.all([
          Profile.findById(profileId).lean(),
          AnalyticsEvent.find({
            entityType: "product",
            eventType: "product_view",
            userId: userObjectId.toString(), // telemetry keyed by auth user id
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
        ]);
      } else {
        // no profile yet; only telemetry
        viewHistory = await AnalyticsEvent.find({
          entityType: "product",
          eventType: "product_view",
          userId: userObjectId.toString(),
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      }

      const categoryIds = new Set<string>();
      const viewedProductIds: Types.ObjectId[] = [];

      // wishlist-based preferences (from Profile)
      if (profile?.wishlist?.length) {
        const wishlistProducts = await Product.find({
          _id: { $in: profile.wishlist },
          isActive: true,
        })
          .select("category")
          .lean();

        wishlistProducts.forEach((p: any) => {
          if (p.category) categoryIds.add(p.category.toString());
        });
      }

      // recently viewed (from Profile)
      if (profile?.recentlyViewed?.length) {
        const recentProducts = await Product.find({
          _id: { $in: profile.recentlyViewed },
          isActive: true,
        })
          .select("category")
          .lean();

        recentProducts.forEach((p: any) => {
          if (p.category) categoryIds.add(p.category.toString());
          viewedProductIds.push(p._id);
        });
      }

      // telemetry-based prefs (AnalyticsEvent → entityId)
      if (viewHistory?.length) {
        const viewedIds = viewHistory
          .map((v: any) => v.entityId)
          .filter((id: string) => mongoose.isValidObjectId(id));
        const viewedProducts = await Product.find({
          _id: { $in: viewedIds },
          isActive: true,
        })
          .select("category")
          .lean();

        viewedProducts.forEach((p: any) => {
          if (p.category) categoryIds.add(p.category.toString());
          viewedProductIds.push(p._id);
        });
      }

      const allExcludeIds: Types.ObjectId[] = [
        ...excludeObjectIds,
        ...(profile?.wishlist || []),
        ...(profile?.recentlyViewed || []),
        ...viewedProductIds,
      ];

      if (categoryIds.size > 0) {
        const categoryObjectIds = Array.from(categoryIds)
          .filter((id) => mongoose.isValidObjectId(id))
          .map((id) => new Types.ObjectId(id));

        const relatedCategories = await Category.find({
          $or: [
            { _id: { $in: categoryObjectIds } },
            { parent: { $in: categoryObjectIds } },
            { children: { $in: categoryObjectIds } },
          ],
          isActive: true,
        })
          .select("_id")
          .lean();

        const allCategoryIds = relatedCategories.map((c: any) => c._id);

        // Rank inside preferred categories by Product.score
        recommendations = await Product.find({
          category: { $in: allCategoryIds },
          isActive: true,
          _id: { $nin: allExcludeIds },
        })
          .sort({ score: -1, createdAt: -1 })
          .limit(limit)
          .populate("category", "name slug")
          .lean();

        if (recommendations.length > 0) {
          strategy = "personalized";
        }
      }
    }

    // ─────────────────────────────────────────
    // Strategy 2: Popular products (from Product.score)
    // ─────────────────────────────────────────
    if (recommendations.length < limit) {
      const remaining = limit - recommendations.length;
      const existingIds = recommendations.map((r: any) => r._id);

      const popularProducts = await Product.find({
        isActive: true,
        _id: {
          $nin: [...excludeObjectIds, ...existingIds],
        },
      })
        .sort({ score: -1, createdAt: -1 }) // precomputed score
        .limit(remaining)
        .populate("category", "name slug")
        .lean();

      if (popularProducts.length > 0) {
        recommendations = [...recommendations, ...popularProducts];
        if (strategy === "fallback") strategy = "popular";
      }
    }

    // ─────────────────────────────────────────
    // Strategy 3: Latest products (final fallback)
    // ─────────────────────────────────────────
    if (recommendations.length < limit) {
      const remaining = limit - recommendations.length;
      const existingIds = recommendations.map((r: any) => r._id);

      const latestProducts = await Product.find({
        isActive: true,
        _id: { $nin: [...excludeObjectIds, ...existingIds] },
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .populate("category", "name slug")
        .lean();

      recommendations = [...recommendations, ...latestProducts];
      if (strategy === "fallback" && latestProducts.length > 0) {
        strategy = "latest";
      }
    }

    // Optional: shuffle for variety
    recommendations = shuffleArray(recommendations);

    const transformedProducts = recommendations.map((product: any) => ({
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
      images: product.images || [],
      isActive: product.isActive,
      // you *can* expose internal ranking data if useful:
      // score: product.score,
      // totalViews: product.totalViews,
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        meta: {
          total: transformedProducts.length,
          strategy,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Recommendation API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
