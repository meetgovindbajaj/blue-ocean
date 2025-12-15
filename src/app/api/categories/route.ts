import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import SiteSettings from "@/models/SiteSettings";
import { NextRequest, NextResponse } from "next/server";

interface QueryFilter {
  isActive: boolean;
  parent?: null | { $ne: null };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
}

interface ProductQueryFilter {
  isActive: boolean;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
  "prices.retail"?: { $gte?: number; $lte?: number };
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

// Convert price from user currency to base currency (for filtering)
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

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const parentOnly = searchParams.get("parentOnly") === "true";
    const withCounts = searchParams.get("withCounts") === "true";
    const onlyWithProducts = searchParams.get("onlyWithProducts") === "true";
    const limit = searchParams.get("limit");
    const page = searchParams.get("page") || "1";

    // Product filter params - for filtering which products to count
    const productSearch = searchParams.get("productSearch");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const priceCurrency = searchParams.get("priceCurrency");

    // Input validation
    const limitNum = limit ? Math.min(Math.max(parseInt(limit), 1), 100) : 50;
    const pageNum = Math.max(parseInt(page), 1);
    const skip = (pageNum - 1) * limitNum;

    const query: QueryFilter = { isActive: true };

    // Filter for parent categories only (no parent)
    if (parentOnly) {
      query.parent = null;
    }

    // Search functionality (for category names)
    if (search?.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    // If withCounts is requested, use aggregation pipeline
    if (withCounts || onlyWithProducts) {
      // Build product filter query
      const productQuery: ProductQueryFilter = { isActive: true };

      // Product search filter (search in product name/description)
      if (productSearch?.trim()) {
        const sanitized = productSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        productQuery.$or = [
          { name: { $regex: sanitized, $options: "i" } },
          { description: { $regex: sanitized, $options: "i" } },
        ];
      }

      // Price filter - convert from user's currency to base currency if needed
      let minPriceNum = minPrice ? Number(minPrice) : null;
      let maxPriceNum = maxPrice ? Number(maxPrice) : null;

      if (priceCurrency && (minPriceNum !== null || maxPriceNum !== null)) {
        // Get site settings for base currency and exchange rates
        const settings = await SiteSettings.findOne().select("locale").lean();
        if (settings?.locale) {
          const baseCurrency = (settings.locale as { currency?: string }).currency || "USD";
          const exchangeRates = (settings.locale as { exchangeRates?: Record<string, number> }).exchangeRates || {};

          if (priceCurrency !== baseCurrency) {
            if (minPriceNum !== null) {
              minPriceNum = convertToBaseCurrency(minPriceNum, priceCurrency, baseCurrency, exchangeRates);
            }
            if (maxPriceNum !== null) {
              maxPriceNum = convertToBaseCurrency(maxPriceNum, priceCurrency, baseCurrency, exchangeRates);
            }
          }
        }
      }

      if (minPriceNum !== null || maxPriceNum !== null) {
        productQuery["prices.retail"] = {
          ...(minPriceNum !== null && { $gte: minPriceNum }),
          ...(maxPriceNum !== null && { $lte: maxPriceNum }),
        };
      }

      // Get product counts per category using aggregation with filters
      const productCounts = await Product.aggregate([
        { $match: productQuery },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]);

      // Create a map of category ID to count
      const countMap = new Map<string, number>();
      productCounts.forEach((item: any) => {
        if (item._id) {
          countMap.set(item._id.toString(), item.count);
        }
      });

      // Get categories
      let categories = await Category.find(query)
        .select("id name slug description image children isActive")
        .populate({
          path: "children",
          select: "id name slug image isActive",
          match: { isActive: true },
        })
        .sort({ name: 1 })
        .lean();

      // Transform and add counts
      let transformedCategories = categories.map((cat: any) => {
        const catId = cat._id?.toString() || cat.id;
        const productCount = countMap.get(catId) || 0;
        return {
          id: cat.id || catId,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          productCount,
          children: cat.children?.map((child: any) => {
            const childId = child._id?.toString() || child.id;
            return {
              id: child.id || childId,
              name: child.name,
              slug: child.slug,
              image: child.image,
              productCount: countMap.get(childId) || 0,
            };
          }),
          isActive: cat.isActive,
        };
      });

      // Filter to only include categories with direct products > 0 if requested
      if (onlyWithProducts) {
        transformedCategories = transformedCategories.filter(
          (cat: any) => cat.productCount > 0
        );
      }

      // Apply pagination manually after filtering
      const totalCount = transformedCategories.length;
      const paginatedCategories = transformedCategories.slice(skip, skip + limitNum);

      return NextResponse.json(
        {
          success: true,
          categories: paginatedCategories,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalCount / limitNum),
          },
        },
        { headers: CACHE_HEADERS }
      );
    }

    // Standard query without counts
    const totalCount = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .select("id name slug description image children isActive")
      .populate({
        path: "children",
        select: "id name slug image isActive",
        match: { isActive: true },
      })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Transform to ensure consistent id field
    const transformedCategories = categories.map((cat: any) => ({
      id: cat.id || cat._id?.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      children: cat.children?.map((child: any) => ({
        id: child.id || child._id?.toString(),
        name: child.name,
        slug: child.slug,
        image: child.image,
      })),
      isActive: cat.isActive,
    }));

    return NextResponse.json(
      {
        success: true,
        categories: transformedCategories,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Categories API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
