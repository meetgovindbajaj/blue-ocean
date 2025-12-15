import { Metadata } from "next";
import CategoriesPageClient from "./CategoriesPageClient";
import { SEOContainer, SEOCategoryData } from "@/components/ui/skeletons";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const title = "Categories";
  const description = "Browse our furniture categories. Find tables, chairs, beds, sofas, storage and more premium quality solid wood furniture collections.";
  const ogImage = settings.seo?.ogImage || `${siteUrl}/og-image.jpg`;
  const pageUrl = `${siteUrl}/categories`;

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
          alt: `${siteName} - Furniture Categories`,
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

interface SEOCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  children?: SEOCategory[];
}

// Server-side data fetching for SEO
async function getCategories(): Promise<SEOCategory[]> {
  try {
    const res = await fetch(
      `${baseUrl}/api/categories?parentOnly=true&withCounts=true&limit=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  // Fetch categories server-side for SEO
  const categories = await getCategories();

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>Furniture Categories</h1>
        <p>Browse our complete collection of {categories.length} furniture categories including premium quality solid wood furniture.</p>

        <nav aria-label="Category Navigation">
          <h2>All Categories</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <SEOCategoryData category={category} />
                <a href={`/categories?slug=${category.slug}`}>
                  {category.name}
                  {category.productCount ? ` (${category.productCount} products)` : ""}
                </a>
                {category.children && category.children.length > 0 && (
                  <ul>
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <a href={`/categories?slug=${child.slug}`}>
                          {child.name}
                          {child.productCount ? ` (${child.productCount} products)` : ""}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </SEOContainer>

      {/* Client-side interactive component */}
      <CategoriesPageClient initialCategories={categories} />
    </>
  );
}
