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

// Dynamic metadata generation from database settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const metaTitle = settings.seo?.metaTitle || `${siteName} - Quality Solid Wood Furniture`;
  const metaDescription = settings.seo?.metaDescription || "Quality Solid Wood Furniture for Your Home";

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
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager - Head Script */}
        {GTM_ID && (
          <Script id="gtm-head" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}
      </head>
      <body className={`${montserrat.variable} ${montserratMono.variable}`}>
        {/* Google Tag Manager - Noscript (immediately after body) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
