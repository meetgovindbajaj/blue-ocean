import { Suspense } from "react";
import { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import FloatingActions from "@/components/shared/FloatingActions";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";

// Fetch site settings for metadata
async function getSiteSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.settings : null;
  } catch (error) {
    console.error("Failed to fetch site settings for metadata:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings?.siteName || "Blue Ocean";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
  const title = settings?.seo?.metaTitle || `${siteName} - Premium Quality Solid Wood Furniture`;
  const description = settings?.seo?.metaDescription || "Connecting global markets through quality products, exceptional service, and innovative solutions. We are your trusted partner in international trade.";
  const keywords = settings?.seo?.keywords || ["furniture", "home-decor", "solid wood", "premium furniture"];
  const ogImage = settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: keywords.join(", "),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: settings?.locale?.locale || "en_US",
      url: siteUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: settings?.socialLinks?.find((s: { platform: string }) => s.platform.toLowerCase().includes("twitter"))?.url || undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add verification codes here if needed
      // google: "google-verification-code",
      // yandex: "yandex-verification-code",
    },
    category: "ecommerce",
    other: {
      "theme-color": "#ffffff",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },
  };
}

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <CurrencyProvider>
          <GoogleAnalytics />
          <Suspense fallback={<div className="h-16 border-b" />}>
            <Header />
          </Suspense>
          <Suspense>{children}</Suspense>
          <Footer />
          <FloatingActions />
          <Toaster position="top-right" />
        </CurrencyProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
