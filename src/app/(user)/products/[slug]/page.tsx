import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient from "@/components/shared/ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success
      ? { product: data.product, breadcrumbs: data.breadcrumbs }
      : null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

async function getRelatedProducts(productSlug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "8" });

    // Use the new related products API that fetches from parent and sibling categories
    const res = await fetch(
      `${baseUrl}/api/products/${productSlug}/related?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.success ? data.products || [] : [];
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}

async function getRecommendedProducts(currentProductId?: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "8" });
    if (currentProductId) params.set("exclude", currentProductId);

    const res = await fetch(
      `${baseUrl}/api/recommendations?${params.toString()}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.success ? data.data?.products || [] : [];
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return [];
  }
}

// Fetch site settings for metadata
async function getSiteSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [data, settings] = await Promise.all([
    getProduct(slug),
    getSiteSettings(),
  ]);

  const siteName = settings?.siteName || "Blue Ocean";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

  if (!data?.product) {
    return {
      title: "Product Not Found",
    };
  }

  const product = data.product;
  const title = product.name;
  const description =
    product.description ||
    `Buy ${product.name} at ${siteName}. ${product.category?.name ? `Category: ${product.category.name}.` : ""} Premium quality solid wood furniture.`;
  const ogImage =
    product.images?.[0]?.url ||
    settings?.seo?.ogImage ||
    `${siteUrl}/og-image.jpg`;
  const productUrl = `${siteUrl}/products/${slug}`;

  // Build JSON-LD structured data for product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Premium furniture`,
    image: product.images?.map((img: any) => img.url) || [],
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: settings?.locale?.currency || "USD",
      price: product.prices?.effectivePrice || product.prices?.retail || 0,
      availability: "https://schema.org/InStock",
    },
    ...(product.category && {
      category: product.category.name,
    }),
  };

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: productUrl,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      "product:price:amount": String(product.prices?.effectivePrice || product.prices?.retail || 0),
      "product:price:currency": settings?.locale?.currency || "USD",
      "script:ld+json": JSON.stringify(jsonLd),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data?.product) {
    notFound();
  }

  // Fetch related and recommended products in parallel
  // Related products now come from parent and sibling categories
  const [relatedProducts, recommendedProducts] = await Promise.all([
    getRelatedProducts(slug),
    getRecommendedProducts(data.product.id),
  ]);

  return (
    <ProductDetailClient
      product={data.product}
      breadcrumbs={data.breadcrumbs}
      relatedProducts={relatedProducts}
      recommendedProducts={recommendedProducts}
    />
  );
}
