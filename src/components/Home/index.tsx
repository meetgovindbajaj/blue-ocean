"use client";

import {
  LandingDataProvider,
  useLandingData,
} from "@/context/LandingDataContext";
import FeaturedCategories from "./FeaturedCategories";
import FeaturedProducts from "./FeaturedProducts";
import FeaturedServices from "./FeaturedServices";
import FeaturedTags from "./FeaturedTags";
import HeroSection from "./Hero";
import styles from "./index.module.css";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeContentProps {
  initialData?: any;
}

const HomeContent = ({ initialData }: HomeContentProps) => {
  const { data: contextData, loading } = useLandingData();

  // Use initial data from server if available, otherwise fall back to context
  const data = initialData || contextData;

  // Skip loading state if we have initial data from server
  if (loading && !initialData) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingSkeleton}>
          {/* Hero Skeleton */}
          <Skeleton className="w-full h-[400px] md:h-[500px] rounded-2xl mb-8" />

          {/* Tags Skeleton */}
          <div className="flex gap-3 justify-center flex-wrap mb-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>

          {/* Products Header Skeleton */}
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl" />
            ))}
          </div>

          {/* Categories Skeleton */}
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeroSection banners={data?.heroBanners || []} />
      <FeaturedTags />
      <FeaturedProducts products={data?.products || []} />
      <FeaturedCategories categories={data?.categories || []} />
      <FeaturedServices />
    </div>
  );
};

interface HomeProps {
  initialData?: any;
}

const Home = ({ initialData }: HomeProps) => {
  return (
    <LandingDataProvider initialData={initialData}>
      <HomeContent initialData={initialData} />
    </LandingDataProvider>
  );
};

export default Home;
