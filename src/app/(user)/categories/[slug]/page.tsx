import { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient from "./CategoryPageClient";
import { SEOContainer, SEOProductData } from "@/components/ui/skeletons";
import { getSiteSettings } from "@/lib/siteMetadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string };
  parent?: { id: string; name: string; slug: string };
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices?: { retail: number; discount?: number };
  category?: { name: string; slug: string };
  images?: { url: string }[];
}

interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
}

// Fetch category data
async function getCategory(slug: string): Promise<{
  category: Category | null;
  breadcrumbs: Breadcrumb[];
}> {
  try {
    const res = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return { category: null, breadcrumbs: [] };
    const data = await res.json();
    return data.success
      ? { category: data.category, breadcrumbs: data.breadcrumbs || [] }
      : { category: null, breadcrumbs: [] };
  } catch {
    return { category: null, breadcrumbs: [] };
  }
}

// Fetch products for category
async function getCategoryProducts(slug: string): Promise<Product[]> {
  try {
    const res = await fetch(
      `${baseUrl}/api/products?category=${slug}&limit=20`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.products : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [{ category }, settings] = await Promise.all([
    getCategory(slug),
    getSiteSettings(),
  ]);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  const siteName = settings.siteName || "Blue Ocean";
  const title = category.name;
  const description =
    category.description ||
    `Browse ${category.name} furniture collection. Premium quality solid wood furniture at ${siteName}.`;
  const ogImage =
    category.image?.url || settings.seo?.ogImage || `${siteUrl}/og-image.jpg`;
  const pageUrl = `${siteUrl}/categories/${slug}`;

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
          alt: `${category.name} - ${siteName}`,
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

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [{ category, breadcrumbs }, products] = await Promise.all([
    getCategory(slug),
    getCategoryProducts(slug),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>{category.name} Furniture Collection</h1>
        {category.description && <p>{category.description}</p>}
        <p>
          Browse {products.length} products in our {category.name} category.
          Premium quality solid wood furniture.
        </p>

        {/* Breadcrumb trail for SEO */}
        <nav aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((crumb) => (
              <li key={crumb.id}>
                <a href={crumb.url}>{crumb.name}</a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Subcategories for SEO */}
        {category.children && category.children.length > 0 && (
          <section aria-label="Subcategories">
            <h2>Subcategories in {category.name}</h2>
            <ul>
              {category.children.map((child) => (
                <li key={child.id}>
                  <a href={`/categories/${child.slug}`}>{child.name}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Products for SEO */}
        {products.length > 0 && (
          <section aria-label="Products">
            <h2>Products in {category.name}</h2>
            {products.map((product) => (
              <SEOProductData key={product.id} product={product} />
            ))}
          </section>
        )}
      </SEOContainer>

      {/* Client-side interactive component */}
      <CategoryPageClient
        slug={slug}
        initialCategory={category}
        initialBreadcrumbs={breadcrumbs}
        initialProducts={products}
      />
    </>
  );
}
