import { cache } from "react";
import connectDB from "./db";
import SiteSettings from "@/models/SiteSettings";

export interface SiteMetadataSettings {
  siteName: string;
  tagline?: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  logo?: {
    url: string;
    alt?: string;
  };
}

// Cache the settings fetch to avoid multiple DB calls during a single request
export const getSiteSettings = cache(async (): Promise<SiteMetadataSettings> => {
  try {
    await connectDB();

    const settings = await SiteSettings.findOne()
      .select("siteName tagline seo logo")
      .lean();

    if (!settings) {
      // Return defaults if no settings exist
      return {
        siteName: "Blue Ocean",
        tagline: "Premium Quality Solid Wood Furniture",
        seo: {
          metaTitle: "Blue Ocean - Premium Quality Solid Wood Furniture",
          metaDescription: "Discover our collection of premium quality solid wood furniture. Handcrafted pieces for your home.",
          keywords: ["furniture", "solid wood", "premium furniture", "home decor"],
        },
      };
    }

    return {
      siteName: (settings as any).siteName || "Blue Ocean",
      tagline: (settings as any).tagline,
      seo: {
        metaTitle: (settings as any).seo?.metaTitle,
        metaDescription: (settings as any).seo?.metaDescription,
        keywords: (settings as any).seo?.keywords,
        ogImage: (settings as any).seo?.ogImage,
      },
      logo: (settings as any).logo,
    };
  } catch (error) {
    console.error("Failed to fetch site settings for metadata:", error);
    // Return defaults on error
    return {
      siteName: "Blue Ocean",
      tagline: "Premium Quality Solid Wood Furniture",
      seo: {
        metaTitle: "Blue Ocean - Premium Quality Solid Wood Furniture",
        metaDescription: "Discover our collection of premium quality solid wood furniture.",
        keywords: ["furniture", "solid wood", "premium furniture"],
      },
    };
  }
});
