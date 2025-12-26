import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Tag from "@/models/Tag";
import HeroBanner, { IHeroBanner } from "@/models/HeroBanner";
import { AnalyticsEvent } from "@/models/Analytics";
import { transformBanner } from "@/lib/transformers/heroBanner";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

export async function GET() {
  try {
    await dbConnect();

    // Fetch all data in parallel
    const [categories, products, tags, heroBanners] = await Promise.all([
      // Categories (parent only with children)
      Category.find({ isActive: true, parent: null })
        .select("id name slug description image children isActive")
        .populate({
          path: "children",
          select: "id name slug image isActive",
          match: { isActive: true },
        })
        .sort({ name: 1 })
        .limit(10)
        .lean(),

      // Products (featured/active, limited for landing page)
      Product.find({ isActive: true })
        .select(
          "id name slug description prices images category isActive createdAt size score totalViews"
        )
        .populate("category", "id name slug")
        .sort({ score: -1, createdAt: -1 })
        .limit(20)
        .lean(),

      // Featured tags
      Tag.find({ isActive: true }).sort({ order: 1, name: 1 }).limit(10).lean(),

      // Hero banners
      fetchHeroBanners(),
    ]);

    // Calculate product counts per category
    const categoryIds = categories.map((cat: any) => cat._id);
    const childCategoryIds = categories.flatMap(
      (cat: any) => cat.children?.map((child: any) => child._id) || []
    );
    const allCategoryIds = [...categoryIds, ...childCategoryIds];

    // Get product counts for all categories
    const productCounts = await Product.aggregate([
      { $match: { isActive: true, category: { $in: allCategoryIds } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      productCounts.map((pc) => [pc._id.toString(), pc.count])
    );

    // Transform categories with product counts
    const transformedCategories = categories.map((cat: any) => {
      const catId = cat._id?.toString() || cat.id;
      const childrenIds =
        cat.children?.map((c: any) => c._id?.toString() || c.id) || [];

      // Sum products in this category + all children
      let totalProducts = countMap.get(catId) || 0;
      childrenIds.forEach((childId: string) => {
        totalProducts += countMap.get(childId) || 0;
      });

      return {
        id: cat.id || catId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        productCount: totalProducts,
        children: cat.children?.map((child: any) => ({
          id: child.id || child._id?.toString(),
          name: child.name,
          slug: child.slug,
          image: child.image,
          productCount: countMap.get(child._id?.toString()) || 0,
        })),
      };
    });

    // Transform products
    const transformedProducts = products.map((product: any) => ({
      id: product.id || product._id?.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      prices: product.prices,
      images: product.images,
      category: product.category
        ? {
            id: product.category.id || product.category._id?.toString(),
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      size: product.size,
      score: product.score,
      totalViews: product.totalViews,
    }));

    // Transform tags
    const transformedTags = tags.map((tag: any) => ({
      id: tag.id || tag._id?.toString(),
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      image: tag.image,
      logo: tag.logo,
      website: tag.website,
      isFeatured: tag.isFeatured,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          categories: transformedCategories,
          products: transformedProducts,
          tags: transformedTags,
          heroBanners,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Landing API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch landing page data",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch and process hero banners
async function fetchHeroBanners() {
  const now = new Date();
  const limit = 10;

  // Auto-deactivate expired banners (end date has passed)
  await HeroBanner.updateMany(
    {
      isActive: true,
      endDate: { $lt: now, $ne: null },
    },
    { $set: { isActive: false } }
  );

  const query = {
    isActive: true,
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
    $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
  };

  // Manual banners
  const manualBanners = await HeroBanner.find({
    ...query,
    sourceType: "manual",
  })
    .sort({ order: 1 })
    .limit(limit)
    .populate("content.productId", "name slug prices images")
    .populate("content.categoryId", "name slug image")
    .lean();

  let allBanners: any[] = [...manualBanners];

  // Auto banners
  const autoBanners = await HeroBanner.find({ ...query, sourceType: "auto" })
    .sort({ order: 1 })
    .lean();

  for (const auto of autoBanners) {
    const enriched = await processAutoBanner(auto as IHeroBanner);
    if (enriched) allBanners.push(enriched);
  }

  allBanners.sort((a, b) => a.order - b.order);
  allBanners = allBanners.slice(0, limit);

  return allBanners.map((b) => transformBanner(b, false));
}

// Process auto-generated banners
async function processAutoBanner(banner: IHeroBanner): Promise<any | null> {
  const config = banner.content?.autoConfig || {};
  const limit = config.limit || 5;
  const period = config.period || "week";

  let products: any[] = [];
  let autoTitle = banner.content?.title;
  let autoSubtitle = banner.content?.subtitle;

  switch (banner.contentType) {
    case "product": {
      const rawProductId: any = banner.content?.productId;
      const productId = rawProductId?._id || rawProductId?.id || rawProductId;

      if (!productId) return null;

      const product = await Product.findById(productId)
        .select("name slug prices images category")
        .populate("category", "name slug")
        .lean();

      if (!product) return null;

      return {
        ...banner,
        content: {
          ...banner.content,
          title: banner.content?.title || product.name,
          productId: product,
        },
      };
    }
    case "category": {
      const rawCategoryId: any = banner.content?.categoryId;
      const categoryId =
        rawCategoryId?._id || rawCategoryId?.id || rawCategoryId;

      if (!categoryId) return null;

      const category = await Category.findById(categoryId)
        .select("name slug image")
        .lean();

      if (!category) return null;

      return {
        ...banner,
        content: {
          ...banner.content,
          title: banner.content?.title || category.name,
          categoryId: category,
        },
      };
    }
    case "custom":
      // Custom banners don't need auto-enrichment; return as-is.
      return banner;
    case "trending": {
      const dateRange = getDateRange(period);

      const trendingStats = await AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "product",
            eventType: "product_view",
            ...(dateRange ? { createdAt: { $gte: dateRange } } : {}),
          },
        },
        { $group: { _id: "$entityId", totalViews: { $sum: 1 } } },
        { $sort: { totalViews: -1 } },
        { $limit: limit },
      ]);

      const productIds = trendingStats.map((s) => s._id);
      const productQuery: any = { isActive: true };

      if (productIds.length) {
        productQuery._id = { $in: productIds };
      }
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .populate("category", "name slug")
        .lean();

      if (!products.length) {
        const fallbackQuery: any = { isActive: true };
        if (config.categoryFilter) {
          fallbackQuery.category = config.categoryFilter;
        }

        products = await Product.find(fallbackQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("category", "name slug")
          .lean();
      }

      const scoreMap = new Map(
        trendingStats.map((s) => [s._id?.toString(), s.totalViews])
      );

      if (products.length && productIds.length) {
        products.sort(
          (a, b) =>
            (scoreMap.get(b._id.toString()) || 0) -
            (scoreMap.get(a._id.toString()) || 0)
        );
      }

      autoTitle ||= banner.content?.title || "Trending Now";
      autoSubtitle ||=
        banner.content?.subtitle || "Most viewed products this " + period;
      break;
    }

    case "new_arrivals": {
      const productQuery: any = { isActive: true };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      autoTitle ||= banner.content?.title || "New Arrivals";
      autoSubtitle ||=
        banner.content?.subtitle || "Fresh additions to our collection";
      break;
    }

    case "offer": {
      const productQuery: any = {
        isActive: true,
        "prices.discount": { $gt: 0 },
      };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ "prices.discount": -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      const maxDiscount = products[0]?.prices?.discount || 0;
      autoTitle ||= banner.content?.title || `Up to ${maxDiscount}% Off`;
      autoSubtitle ||= banner.content?.subtitle || "Limited time offers";
      break;
    }

    default:
      return null;
  }

  if (!products.length) {
    return null;
  }

  return {
    ...banner,
    content: {
      ...banner.content,
      title: autoTitle,
      subtitle: autoSubtitle,
      autoProducts: products.map((p) => ({
        id: p.id || p._id?.toString(),
        name: p.name,
        slug: p.slug,
        prices: p.prices,
        thumbnail:
          p.images?.find((img: any) => img.isThumbnail) || p.images?.[0],
        category: p.category,
      })),
    },
  };
}

function getDateRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
