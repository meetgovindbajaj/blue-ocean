import Hero from "@/components/landing/Hero";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import AboutUs from "@/components/landing/AboutUs";
import Services from "@/components/landing/Services";
import ContactCTA from "@/components/landing/ContactCTA";
import LenisProvider from "@/components/providers/LenisProvider";
import "@/styles/landing.scss";

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
  }>;
  prices: {
    retail: number;
    wholesale: number;
    discount: number;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isActive: boolean;
  [key: string]: unknown;
}

export default async function HomePage() {
  // Fetch real data for the landing page
  let products: Product[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const productsRes = await fetch(`${baseUrl}/api/v1/products?limit=8`, {
      cache: "no-store",
    });

    if (productsRes.ok) {
      const productsData = await productsRes.json();
      products = productsData.products || [];
    }
  } catch (error) {
    console.error("Error fetching data for landing page:", error);
    // Fallback to empty array if API fails
    products = [];
  }

  return (
    <LenisProvider>
      <main className="homepage">
        <Hero />
        <FeaturedProducts products={products} />
        <AboutUs />
        <Services />
        <ContactCTA />
      </main>
    </LenisProvider>
  );
}
