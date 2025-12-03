import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { listImages, CloudinaryImage } from "@/lib/cloudinary";
import Product from "@/models/Product";
import Category from "@/models/Category";
import HeroBanner from "@/models/HeroBanner";
import Tag from "@/models/Tag";
import Profile from "@/models/Profile";

export interface ImageWithUsage extends CloudinaryImage {
  usedIn: {
    type: "product" | "category" | "banner" | "tag" | "avatar";
    id: string;
    name: string;
    slug?: string;
  }[];
  isActive: boolean;
}

// Get all images from Cloudinary with usage info
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "blue_ocean";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const filter = searchParams.get("filter"); // "all" | "active" | "unused"

    // Get images from Cloudinary
    const { images, nextCursor } = await listImages(folder, {
      maxResults: limit,
      nextCursor: cursor,
    });

    // Build usage map based on the folder
    const usageMap = new Map<string, ImageWithUsage["usedIn"]>();

    if (folder === "avatars") {
      // For avatars folder, check Profile model avatars directly
      const profiles = await Profile.find({
        avatar: { $exists: true, $nin: [null, ""] },
      })
        .select("name email avatar")
        .lean();

      profiles.forEach((profile: any) => {
        const avatarUrl = profile.avatar;
        if (avatarUrl) {
          const key = extractPublicId(avatarUrl);
          if (key) {
            const existing = usageMap.get(key) || [];
            existing.push({
              type: "avatar",
              id: profile._id?.toString(),
              name: profile.name || profile.email,
            });
            usageMap.set(key, existing);
          }
        }
      });
    } else {
      // For blue_ocean folder, check products, categories, banners, tags
      const [products, categories, banners, tags] = await Promise.all([
        Product.find({}).select("name slug images").lean(),
        Category.find({}).select("name slug image").lean(),
        HeroBanner.find({}).select("name image mobileImage").lean(),
        Tag.find({}).select("name slug image logo").lean(),
      ]);

      // Check products
      products.forEach((product: any) => {
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img: any) => {
            if (img.id || img.url) {
              const key = img.id || extractPublicId(img.url);
              if (key) {
                const existing = usageMap.get(key) || [];
                existing.push({
                  type: "product",
                  id: product._id?.toString(),
                  name: product.name,
                  slug: product.slug,
                });
                usageMap.set(key, existing);
              }
            }
          });
        }
      });

      // Check categories
      categories.forEach((category: any) => {
        if (category.image) {
          const img = category.image;
          const key = img.id || extractPublicId(img.url);
          if (key) {
            const existing = usageMap.get(key) || [];
            existing.push({
              type: "category",
              id: category._id?.toString(),
              name: category.name,
              slug: category.slug,
            });
            usageMap.set(key, existing);
          }
        }
      });

      // Check banners
      banners.forEach((banner: any) => {
        [banner.image, banner.mobileImage].forEach((img: any) => {
          if (img) {
            const key = img.id || extractPublicId(img.url);
            if (key) {
              const existing = usageMap.get(key) || [];
              existing.push({
                type: "banner",
                id: banner._id?.toString(),
                name: banner.name,
              });
              usageMap.set(key, existing);
            }
          }
        });
      });

      // Check tags
      tags.forEach((tag: any) => {
        [tag.image, tag.logo].forEach((img: any) => {
          if (img) {
            const key = img.id || extractPublicId(img.url);
            if (key) {
              const existing = usageMap.get(key) || [];
              existing.push({
                type: "tag",
                id: tag._id?.toString(),
                name: tag.name,
                slug: tag.slug,
              });
              usageMap.set(key, existing);
            }
          }
        });
      });
    }

    // Enhance images with usage info
    let enhancedImages: ImageWithUsage[] = images.map((img) => {
      const usedIn = usageMap.get(img.id) || [];
      return {
        ...img,
        usedIn,
        isActive: usedIn.length > 0,
      };
    });

    // Apply filter
    if (filter === "active") {
      enhancedImages = enhancedImages.filter((img) => img.isActive);
    } else if (filter === "unused") {
      enhancedImages = enhancedImages.filter((img) => !img.isActive);
    }

    // Count stats
    const stats = {
      total: images.length,
      active: images.filter((img) => (usageMap.get(img.id) || []).length > 0).length,
      unused: images.filter((img) => (usageMap.get(img.id) || []).length === 0).length,
    };

    return NextResponse.json({
      success: true,
      images: enhancedImages,
      nextCursor,
      stats,
    });
  } catch (error) {
    console.error("Admin images GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// Helper to extract public ID from Cloudinary URL
function extractPublicId(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;

  try {
    // Extract the part after /upload/ and before the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
