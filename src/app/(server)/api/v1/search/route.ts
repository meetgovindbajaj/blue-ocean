import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

interface SearchFilter {
  $and: Array<Record<string, unknown>>;
  $text?: { $search: string };
}

interface PriceFilter {
  $gte?: number;
  $lte?: number;
}

interface SortOptions {
  [key: string]: 1 | -1 | { $meta: string };
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock") === "true";
    const sortBy = searchParams.get("sortBy") || "relevance";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build search filter
    const searchFilter: SearchFilter = {
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { tags: { $in: [new RegExp(query, "i")] } },
          ],
        },
      ],
    };

    // Add category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        searchFilter.$and.push({ category: categoryDoc._id });
      }
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      const priceFilter: PriceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      searchFilter.$and.push({ "prices.retail": priceFilter });
    }

    // Add stock filter
    if (inStock) {
      searchFilter.$and.push({ isActive: true });
    }

    // Build sort options
    let sortOptions: SortOptions = {};
    switch (sortBy) {
      case "price":
        sortOptions = { "prices.retail": sortOrder === "asc" ? 1 : -1 };
        break;
      case "name":
        sortOptions = { name: sortOrder === "asc" ? 1 : -1 };
        break;
      case "created":
        sortOptions = { createdAt: sortOrder === "asc" ? 1 : -1 };
        break;
      default:
        // Relevance sorting (by text score)
        sortOptions = { score: { $meta: "textScore" } };
        break;
    }

    // Add text index for relevance scoring if using text search
    if (sortBy === "relevance") {
      searchFilter.$text = { $search: query };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const [products, total, categories, priceStats] = await Promise.all([
      Product.find(searchFilter)
        .populate("category", "name slug")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(searchFilter),

      Category.find({ isActive: true })
        .select("name slug")
        .sort({ name: 1 })
        .lean(),

      Product.aggregate([
        { $match: searchFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$prices.retail" },
            maxPrice: { $max: "$prices.retail" },
          },
        },
      ]),
    ]);

    // Format price range
    const priceRange =
      priceStats.length > 0
        ? {
            min: Math.floor(priceStats[0].minPrice || 0),
            max: Math.ceil(priceStats[0].maxPrice || 1000),
          }
        : { min: 0, max: 1000 };

    // Format products
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      slug: product.slug,
      images: product.images || [],
      prices: product.prices,
      category: product.category,
      isActive: product.isActive,
      size: product.size,
      createdAt: product.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          products: formattedProducts,
          total,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          })),
          priceRange,
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
