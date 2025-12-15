import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://blue--ocean.vercel.app";

interface Product {
  slug: string;
  updatedAt?: string;
  images?: { url: string }[];
}

interface Category {
  slug: string;
  updatedAt?: string;
  image?: { url: string };
}

interface LegalDocument {
  slug: string;
  updatedAt?: string;
}

// Fetch all products for sitemap
async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${baseUrl}/api/products?limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.products : [];
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
    return [];
  }
}

// Fetch all categories for sitemap
async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${baseUrl}/api/categories?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch (error) {
    console.error("Failed to fetch categories for sitemap:", error);
    return [];
  }
}

// Fetch legal documents for sitemap
async function getLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const res = await fetch(`${baseUrl}/api/legal-documents?activeOnly=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.documents : [];
  } catch (error) {
    console.error("Failed to fetch legal documents for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all dynamic content in parallel
  const [products, categories, legalDocs] = await Promise.all([
    getProducts(),
    getCategories(),
    getLegalDocuments(),
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
