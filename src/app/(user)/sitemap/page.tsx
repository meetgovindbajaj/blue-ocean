import { Metadata } from "next";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import SiteSettings from "@/models/SiteSettings";
import SitemapPageClient from "./SitemapPageClient";

// Force dynamic rendering to fetch fresh data from database
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

// Fetch all data for sitemap directly from database
async function getSitemapData() {
  try {
    await dbConnect();

    const [categories, products, settings] = await Promise.all([
      // Fetch categories with children
      Category.find({ isActive: true })
        .select("id name slug description image children isActive")
        .populate({
          path: "children",
          select: "id name slug image isActive",
          match: { isActive: true },
        })
        .sort({ name: 1 })
        .limit(100)
        .lean(),
      // Fetch active products
      Product.find({ isActive: true })
        .select("id name slug category")
        .populate({
          path: "category",
          select: "name slug",
        })
        .sort({ name: 1 })
        .limit(500)
        .lean(),
      // Fetch site settings
      SiteSettings.findOne().lean(),
    ]);

    // Transform categories
    const transformedCategories = categories.map((cat: any) => ({
      id: cat.id || cat._id?.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      children: cat.children?.map((child: any) => ({
        id: child.id || child._id?.toString(),
        name: child.name,
        slug: child.slug,
        image: child.image,
      })),
    }));

    // Transform products
    const transformedProducts = products.map((product: any) => ({
      id: product.id || product._id?.toString(),
      name: product.name,
      slug: product.slug,
      category: product.category ? {
        name: product.category.name,
        slug: product.category.slug,
      } : undefined,
    }));

    // Serialize to plain objects (removes Mongoose special properties like _id buffers)
    return JSON.parse(JSON.stringify({
      categories: transformedCategories,
      products: transformedProducts,
      settings: settings ? { siteName: settings.siteName } : null,
    }));
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
