import { MetadataRoute } from "next";
// import { getAllData } from "@/lib/api";
import { formatDateToWords } from "@/lib/functions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: formatDateToWords(new Date("2025-05-01")),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
    // Add other static pages here if you have them (e.g., /about, /contact)
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly" as const,
    //   priority: 0.8,
    // },
  ];

  // let productRoutes: MetadataRoute.Sitemap = [];
  // try {
  //   const { products } = await getAllData(); // Fetch all products

  //   if (!products || !Array.isArray(products))
  //     console.error("No products found or products is not an array.");
  //   productRoutes = (
  //     products as Array<{ slug: string; updatedAt: string }>
  //   ).map((product) => ({
  //     url: `${baseUrl}/product/${product.slug}`,
  //     lastModified: formatDateToWords(product.updatedAt ?? new Date()),
  //     changeFrequency: "weekly" as const,
  //     priority: 0.9,
  //   }));
  // } catch (_error) {
  //   console.error("Error fetching products for sitemap");
  // }
  return [...staticRoutes];
}
