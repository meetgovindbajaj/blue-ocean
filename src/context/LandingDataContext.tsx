"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { HeroBanner } from "@/types/heroBanner";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    thumbnailUrl?: string;
  };
  productCount: number;
  children?: {
    id: string;
    name: string;
    slug: string;
    image?: {
      url: string;
      thumbnailUrl?: string;
    };
    productCount: number;
  }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
    effectivePrice?: number;
  };
  images: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl?: string;
    size?: number;
    width?: number;
    height?: number;
  }[];
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  size?: {
    length: number;
    width: number;
    height: number;
    fixedSize?: boolean;
    unit: string;
  };
  score?: number;
  totalViews?: number;
  isActive?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    thumbnailUrl?: string;
  };
  logo?: {
    url: string;
  };
  website?: string;
  isFeatured: boolean;
}

interface LandingData {
  categories: Category[];
  products: Product[];
  tags: Tag[];
  heroBanners: HeroBanner[];
}

interface LandingDataContextValue {
  data: LandingData | null;
  loading: boolean;
  error: string | null;
}

const defaultData: LandingData = {
  categories: [],
  products: [],
  tags: [],
  heroBanners: [],
};

const LandingDataContext = createContext<LandingDataContextValue>({
  data: defaultData,
  loading: true,
  error: null,
});

export function LandingDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const response = await fetch("/api/landing");
        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData(defaultData);
        }
      } catch (err) {
        console.error("Failed to fetch landing data:", err);
        setError("Failed to load landing page data");
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  return (
    <LandingDataContext.Provider value={{ data, loading, error }}>
      {children}
    </LandingDataContext.Provider>
  );
}

export function useLandingData() {
  const context = useContext(LandingDataContext);
  if (context === undefined) {
    throw new Error("useLandingData must be used within a LandingDataProvider");
  }
  return context;
}

export default LandingDataContext;
