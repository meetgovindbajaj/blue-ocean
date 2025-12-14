import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import HeroBanner from "@/models/HeroBanner";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import { generateCtaLink, transformBanner, transformBanners } from "@/lib/transformers/heroBanner";

export const dynamic = "force-dynamic";

// CREATE new banner
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Banner name is required" },
        { status: 400 }
      );
    }

    if (!body.image?.url || !body.image?.id) {
      return NextResponse.json(
        { success: false, error: "Banner image is required" },
        { status: 400 }
      );
    }

    // Transform image to match schema requirements
    const mobileUrl = body.image.mobileUrl;
    body.image = {
      id: body.image.id,
      name: body.image.name || body.image.alt || "Banner Image",
      url: body.image.url,
      thumbnailUrl: body.image.thumbnailUrl || body.image.url || "",
      isThumbnail: body.image.isThumbnail ?? false,
      downloadUrl: body.image.downloadUrl || "",
      size: body.image.size || 0,
      width: body.image.width || 0,
      height: body.image.height || 0,
    };

    // Transform mobileImage if provided
    if (mobileUrl) {
      body.mobileImage = {
        id: `mobile-${body.image.id}`,
        name: "Mobile Banner",
        url: mobileUrl,
        thumbnailUrl: mobileUrl,
        isThumbnail: false,
        downloadUrl: "",
        size: 0,
        width: 0,
        height: 0,
      };
    }

    // Auto-generate ctaLink if not provided
    if (!body.content?.ctaLink) {
      body.content = {
        ...body.content,
        ctaLink: generateCtaLink(body),
      };
    }

    const banner = new HeroBanner(body);
    await banner.save();

    // If banner has a product and discount, update the product's discount and recalculate prices
    if (body.content?.productId && typeof body.content?.discountPercent === "number") {
      const product = await Product.findById(body.content.productId);
      if (product) {
        const discount = body.content.discountPercent;
        const retailPrice = product.prices.retail;
        const effectivePrice = discount > 0
          ? Math.round(retailPrice * (1 - discount / 100))
          : retailPrice;
        // Wholesale price is recalculated based on effective price (70% margin)
        const wholesalePrice = discount > 0
          ? Math.round(effectivePrice * 0.7)
          : product.prices.wholesale || Math.round(retailPrice * 0.7);

        await Product.findByIdAndUpdate(body.content.productId, {
          $set: {
            "prices.discount": discount,
            "prices.effectivePrice": effectivePrice,
            "prices.wholesale": wholesalePrice,
          }
        });
        revalidatePath("/products");
      }
    }

    // Populate and transform for consistent response
    const populated = await HeroBanner.findById(banner._id)
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      banner: transformBanner(populated, true),
    });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

// PATCH - Reorder banners
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { bannerIds } = body;

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Banner IDs array is required" },
        { status: 400 }
      );
    }

    // Update order for each banner
    const updates = bannerIds.map((id: string, index: number) =>
      HeroBanner.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updates);

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      message: "Banner order updated successfully",
    });
  } catch (error) {
    console.error("Reorder banners error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder banners" },
      { status: 500 }
    );
  }
}

// GET all banners (admin view)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // active, inactive, scheduled, expired

    const now = new Date();

    // Auto-deactivate expired banners (end date has passed)
    await HeroBanner.updateMany(
      {
        isActive: true,
        endDate: { $lt: now, $ne: null },
      },
      { $set: { isActive: false } }
    );

    const query: any = {};

    if (status === "active") {
      query.isActive = true;
      query.$or = [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: null, endDate: null },
      ];
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "scheduled") {
      query.startDate = { $gt: now };
    } else if (status === "expired") {
      query.endDate = { $lt: now };
    }

    const [rawBanners, total] = await Promise.all([
      HeroBanner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("content.productId", "name slug prices images")
        .populate("content.categoryId", "name slug image")
        .lean(),
      HeroBanner.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      banners: transformBanners(rawBanners, true),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get banners error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
