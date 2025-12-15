import { Metadata } from "next";
import Home from "@/components/Home";
import styles from "./page.module.css";
import {
  SEOContainer,
  SEOProductData,
  SEOCategoryData,
} from "@/components/ui/skeletons";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

// Fetch site settings for metadata
async function getSiteSettings() {
  try {
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

// Fetch landing page data for SEO
async function getLandingData() {
  try {
    const res = await fetch(`${baseUrl}/api/landing`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to fetch landing data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || "Blue Ocean";
  const title =
    settings?.seo?.metaTitle ||
    `${siteName} - Premium Quality Solid Wood Furniture`;
  const description =
    settings?.seo?.metaDescription ||
    `Welcome to ${siteName}. Discover our collection of premium quality solid wood furniture crafted with precision and care.`;
  const ogImage =
    settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
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
      canonical: siteUrl,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

interface SEOProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices?: { retail: number; discount?: number };
  category?: { name: string; slug: string };
  images?: { url: string }[];
}

interface SEOCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  children?: SEOCategory[];
}

interface SEOTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface HeroBanner {
  id: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

export default async function Page() {
  // Fetch data server-side for SEO
  const [settings, landingData] = await Promise.all([
    getSiteSettings(),
    getLandingData(),
  ]);

  const siteName = settings?.siteName || "Blue Ocean";
  const products: SEOProduct[] = landingData?.products || [];
  const categories: SEOCategory[] = landingData?.categories || [];
  const tags: SEOTag[] = landingData?.tags || [];
  const heroBanners: HeroBanner[] = landingData?.heroBanners || [];

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>{siteName} - Premium Quality Solid Wood Furniture</h1>
        <p>
          Welcome to {siteName}. Discover our collection of premium quality
          solid wood furniture crafted with precision and care. Browse our
          featured products and categories.
        </p>

        {heroBanners.length > 0 && (
          <section aria-label="Featured Banners">
            {heroBanners.map((banner) => (
              <div key={banner.id}>
                {banner.title && <h2>{banner.title}</h2>}
                {banner.subtitle && <p>{banner.subtitle}</p>}
                {banner.link && <a href={banner.link}>Learn More</a>}
              </div>
            ))}
          </section>
        )}

        {tags.length > 0 && (
          <section aria-label="Featured Collections">
            <h2>Featured Collections</h2>
            <ul>
              {tags.map((tag) => (
                <li key={tag.id}>
                  <a href={`/products?tags=${tag.slug}`}>
                    {tag.name}
                    {tag.description && ` - ${tag.description}`}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length > 0 && (
          <section aria-label="Featured Products">
            <h2>Featured Products</h2>
            <p>
              Explore our handpicked selection of {products.length} premium
              furniture pieces.
            </p>
            {products.map((product) => (
              <SEOProductData key={product.id} product={product} />
            ))}
          </section>
        )}

        {categories.length > 0 && (
          <section aria-label="Shop by Category">
            <h2>Shop by Category</h2>
            <p>Browse our {categories.length} furniture categories.</p>
            {categories.map((category) => (
              <SEOCategoryData key={category.id} category={category} />
            ))}
          </section>
        )}

        <section aria-label="Our Services">
          <h2>Why Choose {siteName}?</h2>
          <ul>
            <li>
              <h3>Custom Design</h3>
              <p>
                Tailored furniture built exactly to your vision with premium
                materials.
              </p>
            </li>
            <li>
              <h3>Global Shipping</h3>
              <p>
                Reliable worldwide delivery with trusted logistics partners.
              </p>
            </li>
            <li>
              <h3>Expert Support</h3>
              <p>
                End-to-end guidance with clear communication throughout your
                order.
              </p>
            </li>
            <li>
              <h3>Quality Control</h3>
              <p>Strict inspections ensure world-class craftsmanship.</p>
            </li>
          </ul>
        </section>

        <nav aria-label="Quick Links">
          <ul>
            <li>
              <a href="/products">All Products</a>
            </li>
            <li>
              <a href="/categories">All Categories</a>
            </li>
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
          </ul>
        </nav>
      </SEOContainer>

      {/* Client-side interactive component */}
      <div className={styles.page}>
        <Home initialData={landingData} />
      </div>
    </>
  );
}
