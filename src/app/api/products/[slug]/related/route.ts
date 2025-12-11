import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

/**
 * GET related products for a product
 *
 * Fetches products from:
 * 1. Same category as the product
 * 2. Parent category's products
 * 3. Sibling categories' products (other children of the parent)
 *
 * Results are sorted by score (trending) and deduplicated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "8", 10), 1),
      20
    );

    await dbConnect();

    // Find the product and populate its category with parent
    const product = await Product.findOne({ slug, isActive: true })
      .select("_id category")
      .populate({
        path: "category",
        select: "_id parent children",
        populate: {
          path: "parent",
          select: "_id children",
        },
      })
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const productId = product._id as Types.ObjectId;
    const category = product.category as any;

    // Collect all relevant category IDs
    const categoryIds: Types.ObjectId[] = [];

    if (category?._id) {
      // 1. Add current category
      categoryIds.push(category._id);

      // 2. Add current category's children (sub-categories)
      if (category.children?.length) {
        categoryIds.push(...category.children);
      }

      // 3. If there's a parent category
      if (category.parent) {
        const parentCategory = category.parent;

        // Add parent category itself
        categoryIds.push(parentCategory._id);

        // Add sibling categories (other children of parent)
        if (parentCategory.children?.length) {
          for (const siblingId of parentCategory.children) {
            if (!categoryIds.some((id) => id.equals(siblingId))) {
              categoryIds.push(siblingId);
            }
          }
        }
      }
    }

    // If we have no categories, just return empty
    if (categoryIds.length === 0) {
      return NextResponse.json(
        { success: true, products: [] },
        { headers: CACHE_HEADERS }
      );
    }

    // Fetch products from all related categories, excluding the current product
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: { $in: categoryIds },
      isActive: true,
    })
      .select("id name slug description prices images category score totalViews createdAt size")
      .populate("category", "id name slug")
      .sort({ score: -1, totalViews: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const response = NextResponse.json({
      success: true,
      products: relatedProducts,
    });

    Object.entries(CACHE_HEADERS).forEach(([k, v]) =>
      response.headers.set(k, v)
    );

    return response;
  } catch (error: any) {
    console.error("Related Products API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch related products",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
