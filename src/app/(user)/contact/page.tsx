import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

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
  const title = `Contact Us | ${siteName}`;
  const description = `Get in touch with ${siteName}. ${settings?.contact?.email ? `Email: ${settings.contact.email}` : ""} ${settings?.contact?.phone ? `Phone: ${settings.contact.phone}` : ""}`.trim() ||
    `Contact ${siteName} for inquiries about our premium quality solid wood furniture.`;
  const ogImage = settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title: "Contact Us",
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/contact`,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Contact ${siteName}`,
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
      canonical: `${siteUrl}/contact`,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

export default function ContactPage() {
  return <ContactPageClient />;
}
