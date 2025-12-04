import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import HeroBanner from "@/models/HeroBanner";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import { generateCtaLink, transformBanner } from "@/lib/transformers/heroBanner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single banner by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findById(id)
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      banner: transformBanner(banner, true),
    });
  } catch (error) {
    console.error("Get banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// UPDATE banner by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields if provided
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Banner name cannot be empty" },
        { status: 400 }
      );
    }

    if (body.image && (!body.image.url || !body.image.id)) {
      return NextResponse.json(
        { success: false, error: "Banner image requires both id and url" },
        { status: 400 }
      );
    }

    // Transform image to match schema requirements if provided
    if (body.image) {
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

      // Transform mobileImage if provided via mobileUrl in image object
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
      } else if (mobileUrl === "" || mobileUrl === null) {
        // Explicitly remove mobile image if empty string or null is passed
        body.mobileImage = null;
      }
    }

    // Also handle separate mobileImage object if passed directly
    if (body.mobileImage && body.mobileImage.url && body.mobileImage.id) {
      body.mobileImage = {
        id: body.mobileImage.id,
        name: body.mobileImage.name || "Mobile Banner",
        url: body.mobileImage.url,
        thumbnailUrl: body.mobileImage.thumbnailUrl || body.mobileImage.url,
        isThumbnail: false,
        downloadUrl: body.mobileImage.downloadUrl || "",
        size: body.mobileImage.size || 0,
        width: body.mobileImage.width || 0,
        height: body.mobileImage.height || 0,
      };
    }

    // Auto-generate ctaLink if content is being updated but ctaLink is not provided
    if (body.content && !body.content.ctaLink && body.contentType) {
      body.content.ctaLink = generateCtaLink(body);
    }

    const banner = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    // If banner has a product and discount, update the product's discount
    if (body.content?.productId && body.content?.discountPercent > 0) {
      await Product.findByIdAndUpdate(body.content.productId, {
        $set: { "prices.discount": body.content.discountPercent }
      });
      revalidatePath("/products");
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      banner: transformBanner(banner, true),
    });
  } catch (error) {
    console.error("Update banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// PATCH banner (partial update - useful for toggling isActive, updating order, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Only allow specific fields for PATCH
    const allowedFields = ["isActive", "order", "startDate", "endDate"];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      banner: transformBanner(banner, true),
    });
  } catch (error) {
    console.error("Patch banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE banner by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    const banner = await HeroBanner.findByIdAndDelete(id).lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
