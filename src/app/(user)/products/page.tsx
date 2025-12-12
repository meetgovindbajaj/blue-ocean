import { Metadata } from "next";
import SearchResultPage from "@/components/shared/SearchResultPage";
import styles from "./page.module.css";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const title = "Products";
  const description = "Browse our collection of premium quality solid wood furniture. Find tables, chairs, beds, sofas and more crafted with precision and care.";
  const ogImage = settings.seo?.ogImage || `${siteUrl}/og-image.jpg`;
  const pageUrl = `${siteUrl}/products`;

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
          alt: `${siteName} - Product Collection`,
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

const ProductListPage = () => {
  return (
    <div className={styles.page}>
      <SearchResultPage />
    </div>
  );
};

export default ProductListPage;
