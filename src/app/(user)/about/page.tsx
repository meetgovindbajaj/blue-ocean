import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

// Fetch site settings for metadata
async function getSiteSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.settings : null;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings?.siteName || "Blue Ocean";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
  const aboutTitle = settings?.about?.title || `About ${siteName}`;
  const title = `${aboutTitle} | ${siteName}`;
  const description = settings?.about?.description ||
    `Learn about ${siteName} - ${settings?.tagline || "Premium quality solid wood furniture crafted with precision and care."}`;
  const ogImage = settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title: aboutTitle,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/about`,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `About ${siteName}`,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: siteName,
    },
    alternates: {
      canonical: `${siteUrl}/about`,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

export default function AboutPage() {
  return <AboutPageClient />;
}
