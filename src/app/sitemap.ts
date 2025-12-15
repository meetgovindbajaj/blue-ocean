import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import LegalDocument from "@/models/LegalDocument";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  `https://${process.env.VERCEL_URL}` ||
  "https://blue--ocean.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  // Fetch all dynamic content in parallel
  const [products, categories, legalDocs] = await Promise.all([
    Product.find({ isActive: true })
      .select("slug updatedAt images")
      .lean()
      .exec(),
    Category.find({ isActive: true })
      .select("slug updatedAt image")
      .lean()
      .exec(),
    LegalDocument.find({ isVisible: true })
      .select("slug updatedAt")
      .lean()
      .exec(),
  ]);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
    },
  ];

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    ...(product.images?.[0]?.url && {
      images: [product.images[0].url],
    }),
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt
      ? new Date(category.updatedAt)
      : new Date(),
    ...(category.image?.url && {
      images: [category.image.url],
    }),
  }));

  // Legal document pages
  const legalPages: MetadataRoute.Sitemap = legalDocs.map((doc) => ({
    url: `${baseUrl}/legal/${doc.slug}`,
    lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...legalPages];
}
