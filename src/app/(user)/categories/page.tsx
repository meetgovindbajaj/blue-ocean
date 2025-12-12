import { Metadata } from "next";
import CategoriesPageClient from "./CategoriesPageClient";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const title = "Categories";
  const description = "Browse our furniture categories. Find tables, chairs, beds, sofas, storage and more premium quality solid wood furniture collections.";
  const ogImage = settings.seo?.ogImage || `${siteUrl}/og-image.jpg`;
  const pageUrl = `${siteUrl}/categories`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: pageUrl,
      siteName,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteName} - Furniture Categories`,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [ogImage],
      site: siteName,
    },
    alternates: {
      canonical: pageUrl,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
