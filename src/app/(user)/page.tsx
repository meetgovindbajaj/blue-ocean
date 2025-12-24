import { Metadata } from "next";
import Home from "@/components/Home";
import styles from "./page.module.css";
import {
  SEOContainer,
  SEOProductData,
  SEOCategoryData,
} from "@/components/ui/skeletons";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Tag from "@/models/Tag";
import HeroBanner, { IHeroBanner } from "@/models/HeroBanner";
import { AnalyticsEvent } from "@/models/Analytics";
import { transformBanner } from "@/lib/transformers/heroBanner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

// Direct database fetch for site settings
async function getSiteSettings() {
  try {
    await dbConnect();
    const settings = await SiteSettings.findOne().lean().exec();
    return settings;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
}

// Helper function to get date range for auto banners
function getDateRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// Process auto-generated banners
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processAutoBanner(banner: IHeroBanner): Promise<any | null> {
  const config = banner.content?.autoConfig || {};
  const limit = config.limit || 5;
  const period = config.period || "week";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  let autoTitle = banner.content?.title;
  let autoSubtitle = banner.content?.subtitle;

  switch (banner.contentType) {
    case "product": {
      // Hydrate the product so transformBanner can emit slug/prices/thumbnail.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawProductId: any = banner.content?.productId;
      const productId = rawProductId?._id || rawProductId?.id || rawProductId;

      if (!productId) return null;

      const product = await Product.findById(productId)
        .select("name slug prices images category")
        .populate("category", "name slug")
        .lean();

      if (!product) return null;

      return {
        ...banner,
        content: {
          ...banner.content,
          title: banner.content?.title || product.name,
          productId: product,
        },
      };
    }
    case "custom":
      // Custom banners don't need auto-enrichment; return as-is.
      return banner;
    case "trending": {
      const dateRange = getDateRange(period);

      const trendingStats = await AnalyticsEvent.aggregate([
        {
          $match: {
            entityType: "product",
            eventType: "product_view",
            ...(dateRange ? { createdAt: { $gte: dateRange } } : {}),
          },
        },
        { $group: { _id: "$entityId", totalViews: { $sum: 1 } } },
        { $sort: { totalViews: -1 } },
        { $limit: limit },
      ]);

      const productIds = trendingStats.map((s) => s._id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productQuery: any = { isActive: true };

      if (productIds.length) {
        productQuery._id = { $in: productIds };
      }
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .populate("category", "name slug")
        .lean();

      if (!products.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackQuery: any = { isActive: true };
        if (config.categoryFilter) {
          fallbackQuery.category = config.categoryFilter;
        }

        products = await Product.find(fallbackQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("category", "name slug")
          .lean();
      }

      const scoreMap = new Map(
        trendingStats.map((s) => [s._id?.toString(), s.totalViews])
      );

      if (products.length && productIds.length) {
        products.sort(
          (a, b) =>
            (scoreMap.get(b._id.toString()) || 0) -
            (scoreMap.get(a._id.toString()) || 0)
        );
      }

      autoTitle ||= banner.content?.title || "Trending Now";
      autoSubtitle ||=
        banner.content?.subtitle || "Most viewed products this " + period;
      break;
    }

    case "new_arrivals": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productQuery: any = { isActive: true };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      autoTitle ||= banner.content?.title || "New Arrivals";
      autoSubtitle ||=
        banner.content?.subtitle || "Fresh additions to our collection";
      break;
    }

    case "offer": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productQuery: any = {
        isActive: true,
        "prices.discount": { $gt: 0 },
      };
      if (config.categoryFilter) {
        productQuery.category = config.categoryFilter;
      }

      products = await Product.find(productQuery)
        .sort({ "prices.discount": -1 })
        .limit(limit)
        .populate("category", "name slug")
        .lean();

      const maxDiscount = products[0]?.prices?.discount || 0;
      autoTitle ||= banner.content?.title || `Up to ${maxDiscount}% Off`;
      autoSubtitle ||= banner.content?.subtitle || "Limited time offers";
      break;
    }

    default:
      return null;
  }

  if (!products.length) {
    return null;
  }

  return {
    ...banner,
    content: {
      ...banner.content,
      title: autoTitle,
      subtitle: autoSubtitle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      autoProducts: products.map((p: any) => ({
        id: p.id || p._id?.toString(),
        name: p.name,
        slug: p.slug,
        prices: p.prices,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thumbnail:
          p.images?.find((img: any) => img.isThumbnail) || p.images?.[0],
        category: p.category,
      })),
    },
  };
}

// Fetch hero banners with full processing
async function fetchHeroBanners() {
  const now = new Date();
  const limit = 10;

  // Auto-deactivate expired banners
  await HeroBanner.updateMany(
    {
      isActive: true,
      endDate: { $lt: now, $ne: null },
    },
    { $set: { isActive: false } }
  );

  const query = {
    isActive: true,
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
    $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
  };

  // Manual banners
  const manualBanners = await HeroBanner.find({
    ...query,
    sourceType: "manual",
  })
    .sort({ order: 1 })
    .populate("content.productId", "name slug prices images")
    .populate("content.categoryId", "name slug image")
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allBanners: any[] = [...manualBanners];

  // Auto banners
  const autoBanners = await HeroBanner.find({ ...query, sourceType: "auto" })
    .sort({ order: 1 })
    .lean();

  for (const auto of autoBanners) {
    const enriched = await processAutoBanner(auto as IHeroBanner);
    if (enriched) allBanners.push(enriched);
  }

  allBanners.sort((a, b) => a.order - b.order);

  return allBanners.map((b) => transformBanner(b, false));
}

// Direct database fetch for landing page data (matches API response)
async function getLandingData() {
  try {
    await dbConnect();

    const [categories, products, tags, heroBanners] = await Promise.all([
      // Categories (parent only with children)
      Category.find({ isActive: true, parent: null })
        .select("id name slug description image children isActive")
        .populate({
          path: "children",
          select: "id name slug image isActive",
          match: { isActive: true },
        })
        .sort({ name: 1 })
        .limit(10)
        .lean(),

      // Products (featured/active)
      Product.find({ isActive: true })
        .select(
          "id name slug description prices images category isActive createdAt size score totalViews"
        )
        .populate("category", "id name slug")
        .sort({ score: -1, createdAt: -1 })
        .limit(20)
        .lean(),

      // Featured tags
      Tag.find({ isActive: true }).sort({ order: 1, name: 1 }).limit(10).lean(),

      // Hero banners
      fetchHeroBanners(),
    ]);

    // Calculate product counts per category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryIds = categories.map((cat: any) => cat._id);
    const childCategoryIds = categories.flatMap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cat: any) => cat.children?.map((child: any) => child._id) || []
    );
    const allCategoryIds = [...categoryIds, ...childCategoryIds];

    // Get product counts for all categories
    const productCounts = await Product.aggregate([
      { $match: { isActive: true, category: { $in: allCategoryIds } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      productCounts.map((pc) => [pc._id.toString(), pc.count])
    );

    // Transform categories with product counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedCategories = categories.map((cat: any) => {
      const catId = cat._id?.toString() || cat.id;
      const childrenIds =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cat.children?.map((c: any) => c._id?.toString() || c.id) || [];

      // Sum products in this category + all children
      let totalProducts = countMap.get(catId) || 0;
      childrenIds.forEach((childId: string) => {
        totalProducts += countMap.get(childId) || 0;
      });

      return {
        id: cat.id || catId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        productCount: totalProducts,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: cat.children?.map((child: any) => ({
          id: child.id || child._id?.toString(),
          name: child.name,
          slug: child.slug,
          image: child.image,
          productCount: countMap.get(child._id?.toString()) || 0,
        })),
      };
    });

    // Transform products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedProducts = products.map((product: any) => ({
      id: product.id || product._id?.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      prices: product.prices,
      images: product.images,
      category: product.category
        ? {
            id: product.category.id || product.category._id?.toString(),
            name: product.category.name,
            slug: product.category.slug,
          }
        : undefined,
      size: product.size,
      score: product.score,
      totalViews: product.totalViews,
    }));

    // Transform tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedTags = tags.map((tag: any) => ({
      id: tag.id || tag._id?.toString(),
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      image: tag.image,
      logo: tag.logo,
      website: tag.website,
      isFeatured: tag.isFeatured,
    }));

    // Serialize to plain objects to avoid "Only plain objects can be passed to Client Components" error
    // MongoDB documents may contain _id buffers, Date objects, etc. that can't be passed to client
    return JSON.parse(
      JSON.stringify({
        categories: transformedCategories,
        products: transformedProducts,
        tags: transformedTags,
        heroBanners,
      })
    );
  } catch (error) {
    console.error("Failed to fetch landing data:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = settings as any;
  const siteName = s?.siteName || "Blue Ocean";
  const title =
    s?.seo?.metaTitle || `${siteName} - Premium Quality Solid Wood Furniture`;
  const description =
    s?.seo?.metaDescription ||
    `Welcome to ${siteName}. Discover our collection of premium quality solid wood furniture crafted with precision and care.`;
  const ogImage = s?.seo?.ogImage || s?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: siteName,
    },
    alternates: {
      canonical: siteUrl,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

interface SEOProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices?: { retail: number; discount?: number };
  category?: { name: string; slug: string };
  images?: { url: string }[];
}

interface SEOCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  children?: SEOCategory[];
}

interface SEOTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface HeroBannerData {
  id: string;
  title?: string;
  subtitle?: string;
  ctaLink?: string;
}

export default async function Page() {
  // Fetch data server-side for SEO
  const [settings, landingData] = await Promise.all([
    getSiteSettings(),
    getLandingData(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siteName = (settings as any)?.siteName || "Blue Ocean";
  const products: SEOProduct[] = landingData?.products || [];
  const categories: SEOCategory[] = landingData?.categories || [];
  const tags: SEOTag[] = landingData?.tags || [];
  const heroBanners: HeroBannerData[] = landingData?.heroBanners || [];

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>{siteName} - Premium Quality Solid Wood Furniture</h1>
        <p>
          Welcome to {siteName}. Discover our collection of premium quality
          solid wood furniture crafted with precision and care. Browse our
          featured products and categories.
        </p>

        {heroBanners.length > 0 && (
          <section aria-label="Featured Banners">
            {heroBanners.map((banner) => (
              <div key={banner.id}>
                {banner.title && <h2>{banner.title}</h2>}
                {banner.subtitle && <p>{banner.subtitle}</p>}
                {banner.ctaLink && <a href={banner.ctaLink}>Learn More</a>}
              </div>
            ))}
          </section>
        )}

        {tags.length > 0 && (
          <section aria-label="Featured Collections">
            <h2>Featured Collections</h2>
            <ul>
              {tags.map((tag) => (
                <li key={tag.id}>
                  <a href={`/products?tags=${tag.slug}`}>
                    {tag.name}
                    {tag.description && ` - ${tag.description}`}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {products.length > 0 && (
          <section aria-label="Featured Products">
            <h2>Featured Products</h2>
            <p>
              Explore our handpicked selection of {products.length} premium
              furniture pieces.
            </p>
            {products.map((product) => (
              <SEOProductData key={product.id} product={product} />
            ))}
          </section>
        )}

        {categories.length > 0 && (
          <section aria-label="Shop by Category">
            <h2>Shop by Category</h2>
            <p>Browse our {categories.length} furniture categories.</p>
            {categories.map((category) => (
              <SEOCategoryData key={category.id} category={category} />
            ))}
          </section>
        )}

        <section aria-label="Our Services">
          <h2>Why Choose {siteName}?</h2>
          <ul>
            <li>
              <h3>Custom Design</h3>
              <p>
                Tailored furniture built exactly to your vision with premium
                materials.
              </p>
            </li>
            <li>
              <h3>Global Shipping</h3>
              <p>
                Reliable worldwide delivery with trusted logistics partners.
              </p>
            </li>
            <li>
              <h3>Expert Support</h3>
              <p>
                End-to-end guidance with clear communication throughout your
                order.
              </p>
            </li>
            <li>
              <h3>Quality Control</h3>
              <p>Strict inspections ensure world-class craftsmanship.</p>
            </li>
          </ul>
        </section>

        <nav aria-label="Quick Links">
          <ul>
            <li>
              <a href="/products">All Products</a>
            </li>
            <li>
              <a href="/categories">All Categories</a>
            </li>
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
          </ul>
        </nav>
      </SEOContainer>

      {/* Client-side interactive component */}
      <div className={styles.page}>
        <Home initialData={landingData} />
      </div>
    </>
  );
}
