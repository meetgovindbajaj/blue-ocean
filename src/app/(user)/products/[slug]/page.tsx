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

  // Create a clean description for social media (strip HTML if any, limit length)
  const rawDescription = product.description || "";
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, "").substring(0, 200);
  const description = cleanDescription
    ? `${cleanDescription}${cleanDescription.length >= 200 ? "..." : ""}`
    : `Buy ${product.name} at ${siteName}. ${product.category?.name ? `Category: ${product.category.name}.` : ""} Premium quality solid wood furniture.`;

  // Get the best image for OG (prefer thumbnail or first image)
  const thumbnailImage = product.images?.find((img: any) => img.isThumbnail);
  const firstImage = product.images?.[0];
  const ogImage = thumbnailImage?.url || firstImage?.url || settings?.seo?.ogImage || `${siteUrl}/og-image.jpg`;
  const productUrl = `${siteUrl}/products/${slug}`;
  const price = product.prices?.effectivePrice || product.prices?.retail || 0;
  const currency = settings?.locale?.currency || "USD";

  // Build JSON-LD structured data for product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanDescription || `${product.name} - Premium furniture`,
    image: product.images?.map((img: any) => img.url) || [ogImage],
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: currency,
      price: price,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: siteName,
      },
    },
    ...(product.category && {
      category: product.category.name,
    }),
  };

  // Multiple image sizes for different platforms
  const images: Array<{
    url: string;
    width: number;
    height: number;
    alt: string;
    type?: string;
  }> = [
    {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: product.name,
      type: "image/jpeg",
    },
  ];

  // Add additional product images if available (for carousel support on some platforms)
  if (product.images?.length > 1) {
    product.images.slice(1, 4).forEach((img: any) => {
      images.push({
        url: img.url,
        width: img.width || 800,
        height: img.height || 800,
        alt: product.name,
        type: "image/jpeg",
      });
    });
  }

  return {
    title,
    description,
    // Open Graph - works for Facebook, LinkedIn, WhatsApp, Telegram, etc.
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: productUrl,
      siteName,
      locale: "en_US",
      type: "website",
      images,
    },
    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [ogImage],
      site: siteName,
      creator: siteName,
    },
    // Canonical URL
    alternates: {
      canonical: productUrl,
    },
    // Additional meta tags for various platforms
    other: {
      // Facebook/Open Graph product tags
      "product:price:amount": String(price),
      "product:price:currency": currency,
      "product:availability": "in stock",
      "product:condition": "new",
      "product:brand": siteName,
      ...(product.category && { "product:category": product.category.name }),
      // Image dimensions for WhatsApp/Telegram preview optimization
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:type": "image/jpeg",
      // JSON-LD structured data
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
