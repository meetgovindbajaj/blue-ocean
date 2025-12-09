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

// Static metadata defaults - settings are loaded client-side via SiteSettingsProvider
const siteName = "Blue Ocean";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

export const metadata: Metadata = {
  title: {
    default: `${siteName} - Premium Quality Solid Wood Furniture`,
    template: `%s | ${siteName}`,
  },
  description: "Connecting global markets through quality products, exceptional service, and innovative solutions. We are your trusted partner in international trade.",
  keywords: "furniture, home-decor, solid wood, premium furniture",
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
    title: `${siteName} - Premium Quality Solid Wood Furniture`,
    description: "Connecting global markets through quality products, exceptional service, and innovative solutions. We are your trusted partner in international trade.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Premium Quality Solid Wood Furniture`,
    description: "Connecting global markets through quality products, exceptional service, and innovative solutions. We are your trusted partner in international trade.",
    images: [`${siteUrl}/og-image.jpg`],
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
