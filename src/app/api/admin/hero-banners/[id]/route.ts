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

    const now = new Date();

    // Auto-deactivate this banner if it has expired
    await HeroBanner.updateOne(
      {
        _id: id,
        isActive: true,
        endDate: { $lt: now, $ne: null },
      },
      { $set: { isActive: false } }
    );

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

    // If activating a banner via PUT, validate all required info
    if (body.isActive === true) {
      // Merge existing banner data with updates to validate
      const existingBanner = await HeroBanner.findById(id).lean();
      if (existingBanner) {
        const errors: string[] = [];
        const now = new Date();

        // Use updated values if provided, otherwise use existing
        const name = body.name ?? existingBanner.name;
        const imageUrl = body.image?.url ?? existingBanner.image?.url;
        const contentType = body.contentType ?? existingBanner.contentType;
        const endDate = body.endDate !== undefined ? body.endDate : existingBanner.endDate;
        const content = { ...(existingBanner as any).content, ...body.content };

        // Check required fields
        if (!name?.trim()) {
          errors.push("Banner name is required");
        }
        if (!imageUrl) {
          errors.push("Banner image is required");
        }

        // Check schedule - end date must be current day or afterwards
        if (endDate && new Date(endDate) < now) {
          errors.push("End date must be today or in the future");
        }

        // Check offer expiry if applicable
        if (contentType === "offer") {
          const offerValidUntil = content?.offerValidUntil;
          if (offerValidUntil && new Date(offerValidUntil) < now) {
            errors.push("Offer expiry date must be today or in the future");
          }
        }

        // Check product type banner has valid product
        if (contentType === "product") {
          const productId = content?.productId;
          if (!productId) {
            errors.push("Product must be selected for product type banners");
          }
        }

        // Check category type banner has valid category
        if (contentType === "category") {
          const categoryId = content?.categoryId;
          if (!categoryId) {
            errors.push("Category must be selected for category type banners");
          }
        }

        if (errors.length > 0) {
          return NextResponse.json(
            { success: false, error: errors.join(", ") },
            { status: 400 }
          );
        }
      }
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

    // If activating a banner, validate all required info
    if (body.isActive === true) {
      const existingBanner = await HeroBanner.findById(id).lean();
      if (existingBanner) {
        const errors: string[] = [];
        const now = new Date();

        // Check required fields
        if (!existingBanner.name?.trim()) {
          errors.push("Banner name is required");
        }
        if (!existingBanner.image?.url) {
          errors.push("Banner image is required");
        }

        // Check schedule - end date must be current day or afterwards
        if (existingBanner.endDate && new Date(existingBanner.endDate) < now) {
          errors.push("End date must be today or in the future");
        }

        // Check offer expiry if applicable
        if (existingBanner.contentType === "offer") {
          const offerValidUntil = (existingBanner as any).content?.offerValidUntil;
          if (offerValidUntil && new Date(offerValidUntil) < now) {
            errors.push("Offer expiry date must be today or in the future");
          }
        }

        // Check product type banner has valid product
        if (existingBanner.contentType === "product") {
          const productId = (existingBanner as any).content?.productId;
          if (!productId) {
            errors.push("Product must be selected for product type banners");
          }
        }

        // Check category type banner has valid category
        if (existingBanner.contentType === "category") {
          const categoryId = (existingBanner as any).content?.categoryId;
          if (!categoryId) {
            errors.push("Category must be selected for category type banners");
          }
        }

        if (errors.length > 0) {
          return NextResponse.json(
            { success: false, error: errors.join(", ") },
            { status: 400 }
          );
        }

        // If product banner is being activated, sync the product discount
        if (existingBanner.contentType === "product") {
          const productId = (existingBanner as any).content?.productId;
          const discount = (existingBanner as any).content?.discountPercent || 0;
          if (productId && typeof discount === "number") {
            const product = await Product.findById(productId);
            if (product) {
              const retailPrice = product.prices.retail;
              const effectivePrice = discount > 0
                ? Math.round(retailPrice * (1 - discount / 100))
                : retailPrice;
              const wholesalePrice = discount > 0
                ? Math.round(effectivePrice * 0.7)
                : product.prices.wholesale || Math.round(retailPrice * 0.7);

              await Product.findByIdAndUpdate(productId, {
                $set: {
                  "prices.discount": discount,
                  "prices.effectivePrice": effectivePrice,
                  "prices.wholesale": wholesalePrice,
                }
              });
              revalidatePath("/products");
            }
          }
        }
      }
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
