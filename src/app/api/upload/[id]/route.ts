import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteImage, getImageDetails, updateImage } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import HeroBanner from "@/models/HeroBanner";
import Tag from "@/models/Tag";
import Profile from "@/models/Profile";

// GET - Get image details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The ID might be URL encoded, decode it
    const publicId = decodeURIComponent(id);

    const image = await getImageDetails(publicId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error("Get image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get image details" },
      { status: 500 }
    );
  }
}

// PUT - Update/Replace image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicId = decodeURIComponent(id);
    const body = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      );
    }

    const folder = body.folder || "blue_ocean";
    const image = await updateImage(publicId, body.image, { folder });

    return NextResponse.json({
      success: true,
      image,
      message: "Image updated successfully",
    });
  } catch (error) {
    console.error("Update image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE - Delete image and cascade to all usages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicId = decodeURIComponent(id);

    await connectDB();

    // Track affected entities for response
    const affected: {
      products: string[];
      categories: string[];
      banners: string[];
      tags: string[];
      profiles: string[];
      deactivatedProducts: string[];
    } = {
      products: [],
      categories: [],
      banners: [],
      tags: [],
      profiles: [],
      deactivatedProducts: [],
    };

    // Helper to match image by id or URL
    const matchesImage = (img: any) => {
      if (!img) return false;
      if (img.id === publicId) return true;
      if (img.url?.includes(publicId)) return true;
      return false;
    };

    // 1. Remove from products - pull from images array
    const productsWithImage = await Product.find({
      "images.id": publicId,
    }).select("_id name images isActive");

    for (const product of productsWithImage) {
      const updatedImages = product.images.filter(
        (img: any) => !matchesImage(img)
      );

      // Check if product will have no images left
      const updates: any = { images: updatedImages };
      if (updatedImages.length === 0 && product.isActive) {
        updates.isActive = false;
        affected.deactivatedProducts.push(product.name);
      }

      await Product.findByIdAndUpdate(product._id, { $set: updates });
      affected.products.push(product._id.toString());
    }

    // 2. Remove from categories - set image to null
    const categoriesWithImage = await Category.find({
      $or: [
        { "image.id": publicId },
        { image: { $regex: publicId } },
      ],
    }).select("_id name");

    for (const category of categoriesWithImage) {
      await Category.findByIdAndUpdate(category._id, { $unset: { image: 1 } });
      affected.categories.push(category._id.toString());
    }

    // 3. Remove from hero banners and deactivate if main image is removed
    const bannersWithImage = await HeroBanner.find({
      $or: [
        { "image.id": publicId },
        { "mobileImage.id": publicId },
      ],
    }).select("_id name image mobileImage isActive");

    const deactivatedBanners: string[] = [];
    for (const banner of bannersWithImage) {
      const unsetFields: any = {};
      const setFields: any = {};

      // If main image is being deleted, deactivate the banner
      if (banner.image?.id === publicId) {
        unsetFields.image = 1;
        if (banner.isActive) {
          setFields.isActive = false;
          deactivatedBanners.push(banner.name);
        }
      }
      if (banner.mobileImage?.id === publicId) {
        unsetFields.mobileImage = 1;
      }

      const updateQuery: any = {};
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }
      if (Object.keys(setFields).length > 0) {
        updateQuery.$set = setFields;
      }

      if (Object.keys(updateQuery).length > 0) {
        await HeroBanner.findByIdAndUpdate(banner._id, updateQuery);
        affected.banners.push(banner._id.toString());
      }
    }

    // 4. Remove from tags
    const tagsWithImage = await Tag.find({
      $or: [
        { "image.id": publicId },
        { "logo.id": publicId },
      ],
    }).select("_id name");

    for (const tag of tagsWithImage) {
      const updates: any = {};
      if (tag.image?.id === publicId) {
        updates.image = null;
      }
      if (tag.logo?.id === publicId) {
        updates.logo = null;
      }
      if (Object.keys(updates).length > 0) {
        await Tag.findByIdAndUpdate(tag._id, { $unset: updates });
        affected.tags.push(tag._id.toString());
      }
    }

    // 5. Remove from user profiles (avatars)
    const profilesWithAvatar = await Profile.find({
      avatar: { $regex: publicId },
    }).select("_id");

    for (const profile of profilesWithAvatar) {
      await Profile.findByIdAndUpdate(profile._id, { $unset: { avatar: 1 } });
      affected.profiles.push(profile._id.toString());
    }

    // Delete from Cloudinary
    const success = await deleteImage(publicId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete image from Cloudinary" },
        { status: 500 }
      );
    }

    // Revalidate affected pages
    try {
      revalidatePath("/", "layout");
      revalidatePath("/products", "page");
      revalidatePath("/categories", "page");
      revalidatePath("/admin/products", "page");
      revalidatePath("/admin/categories", "page");
    } catch (e) {
      // Ignore revalidation errors
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      affected,
      deactivatedProducts: affected.deactivatedProducts,
      deactivatedBanners,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
