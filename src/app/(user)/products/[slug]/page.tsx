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

async function getRelatedProducts(
  categorySlug?: string,
  currentProductId?: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "5" });
    if (categorySlug) params.set("category", categorySlug);

    const res = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();

    // Filter out the current product
    const products = data.products || [];
    return products
      .filter((p: { id: string }) => p.id !== currentProductId)
      .slice(0, 4);
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data?.product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${data.product.name} - Blue Ocean`,
    description:
      data.product.description || `Buy ${data.product.name} at Blue Ocean`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data?.product) {
    notFound();
  }

  // Get category slug from breadcrumbs
  const categorySlug =
    data.breadcrumbs?.length > 1
      ? data.breadcrumbs[data.breadcrumbs.length - 1]?.slug
      : undefined;

  // Fetch related and recommended products in parallel
  const [relatedProducts, recommendedProducts] = await Promise.all([
    getRelatedProducts(categorySlug, data.product.id),
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
