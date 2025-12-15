import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, FolderTree } from "lucide-react";
import { SEOContainer, SEOCategoryData } from "@/components/ui/skeletons";
import { getSiteSettings } from "@/lib/siteMetadata";
import styles from "./page.module.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    thumbnailUrl?: string;
  };
  productCount?: number;
  children?: Category[];
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || "Blue Ocean";
  const title = "Categories";
  const description =
    "Browse our furniture categories. Find tables, chairs, beds, sofas, storage and more premium quality solid wood furniture collections.";
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

// Server-side data fetching
async function getCategories(): Promise<Category[]> {
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
  const categories = await getCategories();

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>Furniture Categories</h1>
        <p>
          Browse our complete collection of {categories.length} furniture
          categories including premium quality solid wood furniture.
        </p>

        <nav aria-label="Category Navigation">
          <h2>All Categories</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <SEOCategoryData category={category} />
                <a href={`/categories/${category.slug}`}>
                  {category.name}
                  {category.productCount
                    ? ` (${category.productCount} products)`
                    : ""}
                </a>
                {category.children && category.children.length > 0 && (
                  <ul>
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <a href={`/categories/${child.slug}`}>
                          {child.name}
                          {child.productCount
                            ? ` (${child.productCount} products)`
                            : ""}
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

      {/* Visual Category Tree */}
      <div className={styles.page}>
        <div className={styles.categoryTreeContainer}>
          <h1 className={styles.allCategoriesTitle}>All Categories</h1>
          <p className={styles.allCategoriesSubtitle}>
            Browse our product categories
          </p>
          <div className={styles.categoryTree}>
            {categories.map((category) => (
              <div key={category.id} className={styles.categoryTreeItem}>
                <Link
                  href={`/categories/${category.slug}`}
                  className={styles.categoryTreeParent}
                >
                  <div className={styles.categoryTreeImage}>
                    {category.image?.url ? (
                      <Image
                        src={category.image.url}
                        alt={category.name}
                        fill
                        style={{ objectFit: "cover" }}
                        placeholder="blur"
                        blurDataURL={
                          category.image.thumbnailUrl || category.image.url
                        }
                      />
                    ) : (
                      <FolderTree className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className={styles.categoryTreeInfo}>
                    <span className={styles.categoryTreeName}>
                      {category.name}
                    </span>
                    {category.description && (
                      <span className={styles.categoryTreeDescription}>
                        {category.description}
                      </span>
                    )}
                    {category.productCount !== undefined && (
                      <span className={styles.categoryTreeCount}>
                        {category.productCount} products
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className={styles.categoryTreeChildren}>
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className={styles.categoryTreeChild}
                      >
                        <span>{child.name}</span>
                        {child.productCount !== undefined && (
                          <span className={styles.categoryTreeChildCount}>
                            ({child.productCount})
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
