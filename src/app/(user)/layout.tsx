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
import CookieConsent from "@/components/CookieConsent";
import NavigationProgress from "@/components/shared/NavigationProgress";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

// Dynamic metadata generation from database settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const metaTitle = settings.seo?.metaTitle || `${siteName} - Premium Quality Solid Wood Furniture`;
  const metaDescription = settings.seo?.metaDescription || "Connecting global markets through quality products, exceptional service, and innovative solutions. We are your trusted partner in international trade.";
  const keywords = settings.seo?.keywords?.join(", ") || "furniture, home-decor, solid wood, premium furniture";
  const ogImage = settings.seo?.ogImage || `${siteUrl}/og-image.jpg`;

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDescription,
    keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName,
      title: metaTitle,
      description: metaDescription,
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
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
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
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <GoogleAnalytics />
          <Suspense fallback={<div className="h-16 border-b" aria-label="Loading header" />}>
            <Header />
          </Suspense>
          <main id="main-content" role="main" tabIndex={-1}>
            <Suspense>{children}</Suspense>
          </main>
          <Footer />
          <FloatingActions />
          <CookieConsent />
          <Toaster position="top-right" />
        </CurrencyProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
