"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
    language?: string;
  };
}

interface SiteSettingsContextValue {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
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

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  error: null,
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

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, error }}>
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
