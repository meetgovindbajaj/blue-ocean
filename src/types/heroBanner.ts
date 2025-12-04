// Shared HeroBanner types - single source of truth
// Used by API transformers and UI components

export type ContentType = "product" | "category" | "offer" | "custom" | "trending" | "new_arrivals";
export type SourceType = "manual" | "auto";

export interface ImageData {
  url: string;
  thumbnailUrl?: string;
  // Allow additional fields from API
  [key: string]: any;
}

export interface BannerProduct {
  id: string;
  name: string;
  slug: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  thumbnail?: ImageData;
}

export interface BannerCategory {
  id: string;
  name: string;
  slug: string;
  image?: ImageData;
}

export interface AutoProduct {
  id: string;
  name: string;
  slug: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  thumbnail?: ImageData;
  category?: {
    name: string;
    slug: string;
    // Allow additional fields
    [key: string]: any;
  };
}

export interface BannerImage {
  id?: string;
  url: string;
  alt: string;
  mobileUrl?: string;
}

export interface MobileImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
}

export interface AutoConfig {
  limit?: number;
  period?: string;
  categoryFilter?: string;
}

// Base banner fields (used by both public and admin)
export interface HeroBanner {
  id: string;
  name: string;
  contentType: ContentType;
  sourceType: SourceType;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  discountPercent?: number;
  offerCode?: string;
  offerValidUntil?: string;
  product?: BannerProduct | null;
  category?: BannerCategory | null;
  autoProducts?: AutoProduct[] | null;
  autoConfig?: AutoConfig | null;
  image: BannerImage;
  mobileImage?: MobileImage;
  order: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// Extended banner with admin-only fields
export interface HeroBannerAdmin extends HeroBanner {
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface HeroBannersResponse {
  success: boolean;
  banners: HeroBanner[];
}

export interface HeroBannersAdminResponse {
  success: boolean;
  banners: HeroBannerAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HeroBannerResponse {
  success: boolean;
  banner: HeroBanner | HeroBannerAdmin;
}
