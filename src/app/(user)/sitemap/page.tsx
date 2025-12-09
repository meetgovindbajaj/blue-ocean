import { Metadata } from "next";
import SitemapPageClient from "./SitemapPageClient";

// Fetch all data for sitemap
async function getSitemapData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const [categoriesRes, productsRes, settingsRes] = await Promise.all([
      fetch(`${baseUrl}/api/categories?limit=100`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/products?limit=500&isActive=true`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/settings`, { next: { revalidate: 3600 } }),
    ]);

    const [categoriesData, productsData, settingsData] = await Promise.all([
      categoriesRes.ok ? categoriesRes.json() : { categories: [] },
      productsRes.ok ? productsRes.json() : { products: [] },
      settingsRes.ok ? settingsRes.json() : { settings: null },
    ]);

    return {
      categories: categoriesData.categories || [],
      products: productsData.products || [],
      settings: settingsData.settings || null,
    };
  } catch (error) {
    console.error("Failed to fetch sitemap data:", error);
    return { categories: [], products: [], settings: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sitemap",
    description: "Browse all pages, categories, and products on our website. Find everything you need in one place.",
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SitemapPage() {
  const { categories, products, settings } = await getSitemapData();

  return (
    <SitemapPageClient
      categories={categories}
      products={products}
      settings={settings}
    />
  );
}
