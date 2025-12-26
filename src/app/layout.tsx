import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteSettings } from "@/lib/siteMetadata";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const montserratMono = Montserrat({
  variable: "--font-montserrat-mono",
  subsets: ["latin"],
});

// Google Tag Manager ID from environment variable
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://blue--ocean.vercel.app";

// Dynamic metadata generation from database settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const metaTitle =
    settings.seo?.metaTitle || `${siteName} - Quality Solid Wood Furniture`;
  const metaDescription =
    settings.seo?.metaDescription ||
    "Quality Solid Wood Furniture for Your Home";

  return {
    title: metaTitle,
    description: metaDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = `${SITE_URL}/api/images/android-chrome-512x512.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Blue Ocean",
        alternateName: "Blue Ocean Exports",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        // You can match this to your official registered name
        name: "Blue Ocean Exports",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: 512,
          height: 512,
        },
        sameAs: [
          //   "https://www.facebook.com/yourpage",
          //   "https://www.instagram.com/yourpage",
        ],
      },
    ],
  };
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${montserratMono.variable}`}>
        {/*
          In the App Router, Next manages the document <head>.
          Using next/script ensures the GTM loader is inserted correctly (head/body as appropriate)
          and avoids accidental <head>/<meta> output inside <body>.
        */}
        {GTM_ID && (
          <Script
            id="gtm"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
        {/* Google Tag Manager - Noscript (immediately after body) */}
        {GTM_ID && (
          <noscript
            // React/Next can serialize <noscript> children as text; GTM expects real markup.
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        )}
        {SITE_URL && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
