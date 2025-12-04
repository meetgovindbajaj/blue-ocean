// Shared transformer for HeroBanner responses
// Used by both public and admin APIs for consistent response format

import type {
  HeroBanner,
  HeroBannerAdmin,
  BannerProduct,
  BannerCategory,
  AutoProduct,
} from "@/types/heroBanner";

// Helper to safely get ID as string
function getId(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (obj.id) return String(obj.id);
  if (obj._id) return String(obj._id);
  return "";
}

export function generateCtaLink(banner: any): string {
  const { contentType, content } = banner;

  switch (contentType) {
    case "product":
      if (content?.productId?.slug) {
        return `/products/${content.productId.slug}`;
      }
      if (content?.productId && typeof content.productId === "string") {
        return `/products/${content.productId}`;
      }
      return "/products";
    case "category":
      if (content?.categoryId?.slug) {
        return `/category/${content.categoryId.slug}`;
      }
      if (content?.categoryId && typeof content.categoryId === "string") {
        return `/category/${content.categoryId}`;
      }
      return "/categories";
    case "trending":
      return "/products?sort=trending";
    case "new_arrivals":
      return "/products?sort=newest";
    case "offer":
      return "/products?filter=offers";
    case "custom":
    default:
      return content?.ctaLink || "/";
  }
}

function transformProduct(productData: any): BannerProduct | null {
  if (!productData) return null;

  return {
    id: getId(productData),
    name: productData.name || "",
    slug: productData.slug || "",
    prices: {
      wholesale: productData.prices?.wholesale || 0,
      retail: productData.prices?.retail || 0,
      discount: productData.prices?.discount || 0,
    },
    thumbnail: productData.images?.find((img: any) => img.isThumbnail) ||
      productData.images?.[0] || undefined,
  };
}

function transformCategory(categoryData: any): BannerCategory | null {
  if (!categoryData) return null;

  return {
    id: getId(categoryData),
    name: categoryData.name || "",
    slug: categoryData.slug || "",
    image: categoryData.image || undefined,
  };
}

function transformAutoProducts(products: any[]): AutoProduct[] | null {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  return products.map((p) => ({
    id: getId(p),
    name: p.name || "",
    slug: p.slug || "",
    prices: {
      wholesale: p.prices?.wholesale || 0,
      retail: p.prices?.retail || 0,
      discount: p.prices?.discount || 0,
    },
    thumbnail: p.thumbnail || p.images?.find((img: any) => img.isThumbnail) || p.images?.[0] || undefined,
    category: p.category
      ? {
          name: p.category.name || "",
          slug: p.category.slug || "",
        }
      : undefined,
  }));
}

export function transformBanner(banner: any, includeAdminFields: true): HeroBannerAdmin;
export function transformBanner(banner: any, includeAdminFields?: false): HeroBanner;
export function transformBanner(banner: any, includeAdminFields = false): HeroBanner | HeroBannerAdmin {
  const content = banner.content || {};

  const base: HeroBanner = {
    id: getId(banner),
    name: banner.name || "",
    contentType: banner.contentType || "custom",
    sourceType: banner.sourceType || "manual",
    title: content.title || undefined,
    subtitle: content.subtitle || undefined,
    description: content.description || undefined,
    ctaText: content.ctaText || undefined,
    ctaLink: content.ctaLink || generateCtaLink(banner),
    discountPercent: content.discountPercent || undefined,
    offerCode: content.offerCode || undefined,
    offerValidUntil: content.offerValidUntil
      ? new Date(content.offerValidUntil).toISOString()
      : undefined,
    product: transformProduct(content.productId),
    category: transformCategory(content.categoryId),
    autoProducts: transformAutoProducts(content.autoProducts),
    autoConfig: content.autoConfig
      ? {
          limit: content.autoConfig.limit,
          period: content.autoConfig.period,
          categoryFilter: content.autoConfig.categoryFilter
            ? String(content.autoConfig.categoryFilter)
            : undefined,
        }
      : null,
    image: {
      id: banner.image?.id || undefined,
      url: banner.image?.url || "",
      alt: banner.image?.alt || "Hero Banner",
      mobileUrl: banner.mobileImage?.url || undefined,
    },
    mobileImage: banner.mobileImage?.url ? {
      id: banner.mobileImage.id || undefined,
      url: banner.mobileImage.url,
      thumbnailUrl: banner.mobileImage.thumbnailUrl || banner.mobileImage.url,
    } : undefined,
    order: banner.order ?? 0,
    isActive: banner.isActive ?? true,
    startDate: banner.startDate ? new Date(banner.startDate).toISOString() : null,
    endDate: banner.endDate ? new Date(banner.endDate).toISOString() : null,
  };

  if (!includeAdminFields) {
    return base;
  }

  // Return admin version with additional fields
  const admin: HeroBannerAdmin = {
    ...base,
    clicks: banner.clicks ?? 0,
    impressions: banner.impressions ?? 0,
    createdAt: banner.createdAt ? new Date(banner.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: banner.updatedAt ? new Date(banner.updatedAt).toISOString() : new Date().toISOString(),
  };

  return admin;
}

export function transformBanners(banners: any[], includeAdminFields: true): HeroBannerAdmin[];
export function transformBanners(banners: any[], includeAdminFields?: false): HeroBanner[];
export function transformBanners(banners: any[], includeAdminFields = false): HeroBanner[] | HeroBannerAdmin[] {
  if (includeAdminFields) {
    return banners.map((banner) => transformBanner(banner, true));
  }
  return banners.map((banner) => transformBanner(banner, false));
}
