import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SiteSettings from "@/models/SiteSettings";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";

export const dynamic = "force-dynamic";

interface QueryFilter {
  isActive: boolean;
  category?: Types.ObjectId | { $in: Types.ObjectId[] };
  _id?: { $nin: Types.ObjectId[] };
  "prices.retail"?: { $gte?: number; $lte?: number };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
  $and?: Array<{
    $or?: Array<{
      name?: { $regex: string; $options: string };
      description?: { $regex: string; $options: string };
    }>;
  }>;
}

type SortOption = "name" | "price-low" | "price-high" | "newest" | "trending";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

const VALID_SORTS: SortOption[] = [
  "name",
  "price-low",
  "price-high",
  "newest",
  "trending",
];

const SORT_MAP: Record<SortOption, Record<string, 1 | -1>> = {
  name: { name: 1 },
  "price-low": { "prices.retail": 1 },
  "price-high": { "prices.retail": -1 },
  trending: { score: -1, createdAt: -1 },
  newest: { createdAt: -1 },
};

// Convert price from user currency to base currency (for filtering)
// Exchange rates are relative to USD
function convertToBaseCurrency(
  price: number,
  fromCurrency: string,
  baseCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === baseCurrency) return price;

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[baseCurrency] || 1;

  // Convert: fromCurrency -> USD -> baseCurrency
  const priceInUSD = price / fromRate;
  return priceInUSD * toRate;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Support both single category and multiple categories (comma-separated)
    const categoriesParam = searchParams.get("categories");
    const category = searchParams.get("category"); // Legacy support
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const priceCurrency = searchParams.get("priceCurrency"); // Currency user entered price in

    // Additional response options
    const includeRelated = searchParams.get("includeRelated") === "true";
    const includeLessRelevant = searchParams.get("includeLessRelevant") === "true";
    const includeRecommended = searchParams.get("includeRecommended") === "true";

    const limitNum = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );
    const pageNum = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (pageNum - 1) * limitNum;

    // Get site settings for base currency and exchange rates
    let baseCurrency = "USD";
    let exchangeRates: Record<string, number> = {};

    if (priceCurrency && (minPrice || maxPrice)) {
      const settings = await SiteSettings.findOne().select("locale").lean();
      if (settings?.locale) {
        baseCurrency =
          (settings.locale as { currency?: string }).currency || "USD";
        exchangeRates =
          (settings.locale as { exchangeRates?: Record<string, number> })
            .exchangeRates || {};
      }
    }

    const query: QueryFilter = { isActive: true };

    // Collect all category IDs (for related products lookup later)
    let matchedCategoryIds: Types.ObjectId[] = [];
    let parentCategoryIds: Types.ObjectId[] = [];

    // Category filter - support multiple categories (comma-separated) or single legacy category
    const categoryList = categoriesParam
      ? categoriesParam.split(",").map((c) => c.trim()).filter(Boolean)
      : category?.trim()
      ? [category.trim()]
      : [];

    if (categoryList.length > 0) {
      const allCategoryIds: Types.ObjectId[] = [];

      for (const cat of categoryList) {
        if (mongoose.isValidObjectId(cat)) {
          const catId = new Types.ObjectId(cat);
          allCategoryIds.push(catId);
          matchedCategoryIds.push(catId);
        } else {
          // Try slug first, then name (case-insensitive)
          const baseCategory = await Category.findOne({
            $or: [
              { slug: cat },
              { name: { $regex: `^${cat}$`, $options: "i" } },
            ],
            isActive: true,
          })
            .select("_id children parent")
            .lean();

          if (baseCategory) {
            allCategoryIds.push(baseCategory._id);
            matchedCategoryIds.push(baseCategory._id);
            if (baseCategory.children?.length) {
              allCategoryIds.push(...baseCategory.children);
            }
            // Track parent categories for related products
            if (baseCategory.parent) {
              parentCategoryIds.push(baseCategory.parent);
            }
          }
        }
      }

      if (allCategoryIds.length === 0) {
        // No valid categories found
        return NextResponse.json(
          {
            success: true,
            products: [],
            pagination: {
              total: 0,
              page: pageNum,
              limit: limitNum,
              pages: 0,
            },
            filters: { categories: categoryList, search, sort: "newest", minPrice, maxPrice },
          },
          { headers: CACHE_HEADERS }
        );
      }

      query.category = { $in: allCategoryIds };
    }

    // Search filter
    if (search?.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    // Price filter - convert from user's currency to base currency if needed
    let minPriceNum = minPrice ? Number(minPrice) : null;
    let maxPriceNum = maxPrice ? Number(maxPrice) : null;

    // Convert prices from user's currency to base currency
    if (priceCurrency && (minPriceNum !== null || maxPriceNum !== null)) {
      if (priceCurrency !== baseCurrency) {
        if (minPriceNum !== null) {
          minPriceNum = convertToBaseCurrency(
            minPriceNum,
            priceCurrency,
            baseCurrency,
            exchangeRates
          );
        }
        if (maxPriceNum !== null) {
          maxPriceNum = convertToBaseCurrency(
            maxPriceNum,
            priceCurrency,
            baseCurrency,
            exchangeRates
          );
        }
      }
    }

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
        .select(
          "id name slug description prices images category isActive createdAt size score totalViews"
        )
        .populate("category", "id name slug")
        .sort(SORT_MAP[sortOption])
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Get product IDs from main results to exclude from additional queries
    const mainProductIds = products.map((p: any) => p._id);

    // Initialize additional arrays
    let relatedProducts: any[] = [];
    let lessRelevantProducts: any[] = [];
    let recommendedProducts: any[] = [];

    // Get related products from parent/sibling categories (max 20)
    if (includeRelated) {
      try {
        // Get categories from matched products
        const productCategories = products
          .map((p: any) => p.category?._id || p.category)
          .filter(Boolean);

        // Get parent categories
        const categories = await Category.find({
          _id: { $in: productCategories },
        })
          .select("parent")
          .lean();

        const parentIds = categories
          .map((c: any) => c.parent)
          .filter(Boolean);

        // Combine with already found parent category IDs
        const allParentIds = [...new Set([...parentIds, ...parentCategoryIds])];

        if (allParentIds.length > 0) {
          // Get sibling categories (children of parent)
          const siblingCategories = await Category.find({
            parent: { $in: allParentIds },
            isActive: true,
          })
            .select("_id")
            .lean();

          const siblingCategoryIds = siblingCategories.map((c: any) => c._id);

          // Get products from sibling categories
          relatedProducts = await Product.find({
            isActive: true,
            category: { $in: [...siblingCategoryIds, ...allParentIds] },
            _id: { $nin: mainProductIds },
          })
            .select("id name slug description prices images category size breadcrumbs")
            .populate("category", "id name slug")
            .sort({ score: -1 })
            .limit(20)
            .lean();
        }

        // If no related products found, get products from same categories
        if (relatedProducts.length === 0 && productCategories.length > 0) {
          relatedProducts = await Product.find({
            isActive: true,
            category: { $in: productCategories },
            _id: { $nin: mainProductIds },
          })
            .select("id name slug description prices images category size breadcrumbs")
            .populate("category", "id name slug")
            .sort({ score: -1 })
            .limit(20)
            .lean();
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    }

    // Get less relevant products using partial word matches (max 20)
    if (includeLessRelevant) {
      try {
        const excludeIds = [
          ...mainProductIds,
          ...relatedProducts.map((p: any) => p._id).filter(Boolean),
        ].filter(Boolean);

        if (search?.trim()) {
          // Split search into words and create partial match patterns
          const searchTerms = search.trim().split(/\s+/).filter((t) => t.length >= 2);

          if (searchTerms.length > 0) {
            // Create partial patterns - match any word in name or description
            const orConditions: any[] = [];
            for (const term of searchTerms) {
              // Try partial/fuzzy matching by checking if any term partially appears
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              orConditions.push(
                { name: { $regex: escapedTerm, $options: "i" } },
                { description: { $regex: escapedTerm, $options: "i" } }
              );
            }

            lessRelevantProducts = await Product.find({
              isActive: true,
              _id: { $nin: excludeIds },
              $or: orConditions,
            })
              .select("id name slug description prices images category size breadcrumbs")
              .populate("category", "id name slug")
              .sort({ score: -1 })
              .limit(20)
              .lean();
          }
        }

        // If no search or no results, get products from similar price range or recent products
        if (lessRelevantProducts.length === 0 && products.length > 0) {
          // Get average price from main results
          const avgPrice = products.reduce((sum: number, p: any) => sum + (p.prices?.retail || 0), 0) / products.length;
          const priceRange = avgPrice * 0.3; // 30% range

          lessRelevantProducts = await Product.find({
            isActive: true,
            _id: { $nin: excludeIds },
            "prices.retail": { $gte: avgPrice - priceRange, $lte: avgPrice + priceRange },
          })
            .select("id name slug description prices images category size breadcrumbs")
            .populate("category", "id name slug")
            .sort({ score: -1, createdAt: -1 })
            .limit(20)
            .lean();
        }
      } catch (error) {
        console.error("Error fetching less relevant products:", error);
      }
    }

    // Get recommended products (trending/popular products)
    // Only exclude main results, allow overlap with related/less relevant
    if (includeRecommended) {
      try {
        const recommendedQuery: any = {
          isActive: true,
        };

        // Only exclude main product results
        if (mainProductIds.length > 0) {
          recommendedQuery._id = { $nin: mainProductIds };
        }

        recommendedProducts = await Product.find(recommendedQuery)
          .select("id name slug description prices images category size breadcrumbs")
          .populate("category", "id name slug")
          .sort({ score: -1, totalViews: -1 })
          .limit(20)
          .lean();
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      }
    }

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
          categories: categoryList.length > 0 ? categoryList : undefined,
          category: categoryList.length === 0 ? category : undefined,
          search,
          sort: sortOption,
          minPrice: minPriceNum,
          maxPrice: maxPriceNum,
        },
        ...(includeRelated && { relatedProducts }),
        ...(includeLessRelevant && { lessRelevantProducts }),
        ...(includeRecommended && { recommendedProducts }),
      },
      { headers: CACHE_HEADERS }
    );
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
