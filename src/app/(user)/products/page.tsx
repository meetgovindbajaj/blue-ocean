import { Metadata } from "next";
import SearchResultPage from "@/components/shared/SearchResultPage";
import { SEOContainer, SEOProductData } from "@/components/ui/skeletons";
import styles from "./page.module.css";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

// Server-side data fetching for SEO
async function getInitialProducts() {
  try {
    const res = await fetch(
      `${baseUrl}/api/products?limit=20&includeRelated=true&includeRecommended=true`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

async function getCategories() {
  try {
    const res = await fetch(
      `${baseUrl}/api/categories?withCounts=true&onlyWithProducts=true&limit=50`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch {
    return [];
  }
}

interface SEOProduct {
  id: string;
  name: string;
  description?: string;
  slug: string;
  prices?: { retail: number; discount?: number };
  category?: { name: string; slug: string };
  images?: { url: string }[];
}

interface SEOCategory {
  slug: string;
  name: string;
  productCount?: number;
}

const ProductListPage = async () => {
  // Fetch data server-side for SEO
  const [productsData, categories] = await Promise.all([
    getInitialProducts(),
    getCategories(),
  ]);

  const initialProducts: SEOProduct[] = productsData?.products || [];
  const relatedProducts: SEOProduct[] = productsData?.relatedProducts || [];
  const recommendedProducts: SEOProduct[] = productsData?.recommendedProducts || [];

  return (
    <div className={styles.page}>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>Products - Premium Quality Furniture</h1>
        <p>Browse our collection of {initialProducts.length}+ premium quality solid wood furniture items.</p>

        <section aria-label="Product Categories">
          <h2>Categories</h2>
          <ul>
            {categories.map((cat: SEOCategory) => (
              <li key={cat.slug}>
                <a href={`/products?categories=${cat.slug}`}>
                  {cat.name} {cat.productCount ? `(${cat.productCount} products)` : ""}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Products">
          <h2>All Products</h2>
          {initialProducts.map((product) => (
            <SEOProductData key={product.id} product={product} />
          ))}
        </section>

        {relatedProducts.length > 0 && (
          <section aria-label="Related Products">
            <h2>Related Products</h2>
            {relatedProducts.map((product) => (
              <SEOProductData key={product.id} product={product} />
            ))}
          </section>
        )}

        {recommendedProducts.length > 0 && (
          <section aria-label="Recommended Products">
            <h2>Recommended Products</h2>
            {recommendedProducts.map((product) => (
              <SEOProductData key={product.id} product={product} />
            ))}
          </section>
        )}
      </SEOContainer>

      {/* Client-side interactive component */}
      <SearchResultPage
        initialProducts={initialProducts}
        initialCategories={categories}
        initialPagination={productsData?.pagination}
        initialRelatedProducts={relatedProducts}
        initialRecommendedProducts={recommendedProducts}
      />
    </div>
  );
};

export default ProductListPage;
