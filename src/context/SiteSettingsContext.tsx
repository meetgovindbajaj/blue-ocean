"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: {
    url: string;
    alt?: string;
  };
  about: {
    title?: string;
    description?: string;
    mission?: string;
    vision?: string;
    history?: string;
    team?: {
      name: string;
      role: string;
      image?: string;
      bio?: string;
    }[];
    services?: {
      customDesign?: {
        description?: string;
        features?: string[];
      };
      globalShipping?: {
        description?: string;
        features?: string[];
      };
      expertSupport?: {
        description?: string;
        features?: string[];
      };
      qualityControl?: {
        description?: string;
        features?: string[];
      };
    };
  };
  contact: {
    email?: string;
    phone?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    mapUrl?: string;
  };
  socialLinks: { platform: string; url: string }[];
  businessHours?: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  support: {
    whatsappNumber?: string;
    whatsappMessage?: string;
  };
  footer: {
    copyright?: string;
    description?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  faq?: Array<{
    question: string;
    answer: string;
    order?: number;
    isActive?: boolean;
  }>;
  locale?: {
    currency?: string;
    currencySymbol?: string;
    locale?: string;
    exchangeRates?: {
      [key: string]: number;
    };
  };
}

interface SiteSettingsContextValue {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  formatPrice: (price: number) => string;
}

const defaultSettings: SiteSettings = {
  siteName: "Blue Ocean",
  about: {},
  contact: {},
  socialLinks: [],
  support: {},
  footer: {},
  seo: {},
};

const defaultFormatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  error: null,
  formatPrice: defaultFormatPrice,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (data.success && data.settings) {
          setSettings(data.settings);
        } else {
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Failed to fetch site settings:", err);
        setError("Failed to load site settings");
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const formatPrice = useCallback((price: number) => {
    const currency = settings?.locale?.currency || "INR";
    const locale = settings?.locale?.locale || "en-IN";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, [settings?.locale?.currency, settings?.locale?.locale]);

  const value = useMemo(() => ({
    settings,
    loading,
    error,
    formatPrice,
  }), [settings, loading, error, formatPrice]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSiteSettings must be used within a SiteSettingsProvider"
    );
  }
  return context;
}

export default SiteSettingsContext;
