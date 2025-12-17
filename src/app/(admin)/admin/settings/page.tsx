"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Globe,
  MessageCircle,
  Save,
  Info,
  Link as LinkIcon,
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  DollarSign,
  Clock,
  RefreshCw,
  Users,
  History,
  Briefcase,
  PencilRuler,
  Globe2,
  Headset,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Factory,
  Image as ImageIcon,
  Video,
  X,
  MapPin,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";

const SOCIAL_PLATFORMS = [
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Twitter", label: "Twitter / X" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "YouTube", label: "YouTube" },
  { value: "Pinterest", label: "Pinterest" },
  { value: "TikTok", label: "TikTok" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Telegram", label: "Telegram" },
  { value: "Discord", label: "Discord" },
  { value: "Reddit", label: "Reddit" },
  { value: "Snapchat", label: "Snapchat" },
  { value: "Threads", label: "Threads" },
];

const TEAM_SOCIAL_PLATFORMS = [
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter / X" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "GitHub", label: "GitHub" },
  { value: "Portfolio", label: "Portfolio" },
  { value: "Website", label: "Website" },
  { value: "Behance", label: "Behance" },
  { value: "Dribbble", label: "Dribbble" },
];

const CURRENCIES = [
  { value: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { value: "USD", symbol: "$", label: "US Dollar ($)" },
  { value: "EUR", symbol: "€", label: "Euro (€)" },
  { value: "GBP", symbol: "£", label: "British Pound (£)" },
  { value: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { value: "SAR", symbol: "﷼", label: "Saudi Riyal (﷼)" },
  { value: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
  { value: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { value: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
  { value: "CNY", symbol: "¥", label: "Chinese Yuan (¥)" },
];

const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CNY: 7.24,
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface FAQItem {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

interface TeamMemberSocialLink {
  platform: string;
  url: string;
}

interface TeamMember {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  email?: string;
  phone?: string;
  socialLinks?: TeamMemberSocialLink[];
}

interface ServiceContent {
  description?: string;
  features?: string[];
}

interface FactoryImage {
  url: string;
  alt?: string;
  order?: number;
}

interface FactoryVideo {
  title?: string;
  url: string;
  order?: number;
}

interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: { url: string; alt?: string };
  about: {
    title?: string;
    description?: string;
    mission?: string;
    vision?: string;
    history?: string;
    team?: TeamMember[];
    services?: {
      customDesign?: ServiceContent;
      globalShipping?: ServiceContent;
      expertSupport?: ServiceContent;
      qualityControl?: ServiceContent;
    };
    factory?: {
      title?: string;
      description?: string;
      images?: FactoryImage[];
      videos?: FactoryVideo[];
    };
  };
  contact: {
    email: string;
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
  faq?: FAQItem[];
  locale?: {
    currency: string;
    currencySymbol: string;
    locale: string;
    exchangeRates?: {
      [key: string]: number;
    };
  };
  businessHours?: BusinessHour[];
}

const ITEMS_PER_PAGE = 5;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingRates, setRefreshingRates] = useState(false);

  // Pagination state
  const [faqPage, setFaqPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);
  const [socialPage, setSocialPage] = useState(1);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      const response = await fetch("/api/admin/settings?refreshRates=true");
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        if (data.ratesUpdated) {
          toast.success("Exchange rates updated from live data");
        } else {
          toast.info("Exchange rates are already up to date");
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to refresh exchange rates");
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (data.success) {
        // Update local state with the saved settings from server
        // This prevents stale state issues on subsequent saves
        setSettings(data.settings);
        toast.success("Settings saved successfully");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    if (!settings) return;

    const keys = path.split(".");

    // Deep clone the settings to avoid mutation issues
    const newSettings = JSON.parse(JSON.stringify(settings));
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    if (!settings) return;
    const newLinks = [...settings.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSettings({ ...settings, socialLinks: newLinks });
  };

  const addSocialLink = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: [...settings.socialLinks, { platform: "", url: "" }],
    });
  };

  const removeSocialLink = (index: number) => {
    if (!settings) return;
    const newLinks = settings.socialLinks.filter((_, i) => i !== index);
    setSettings({ ...settings, socialLinks: newLinks });
  };

  // FAQ Functions
  const updateFAQ = (index: number, field: string, value: string | boolean) => {
    if (!settings) return;
    const newFAQs = [...(settings.faq || [])];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    setSettings({ ...settings, faq: newFAQs });
  };

  const addFAQ = () => {
    if (!settings) return;
    const newOrder = settings.faq?.length || 0;
    setSettings({
      ...settings,
      faq: [
        ...(settings.faq || []),
        { question: "", answer: "", order: newOrder, isActive: true },
      ],
    });
  };

  const removeFAQ = (index: number) => {
    if (!settings) return;
    const newFAQs = (settings.faq || []).filter((_, i) => i !== index);
    setSettings({ ...settings, faq: newFAQs });
  };

  const moveFAQ = (index: number, direction: "up" | "down") => {
    if (!settings || !settings.faq) return;
    const newFAQs = [...settings.faq];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFAQs.length) return;
    [newFAQs[index], newFAQs[newIndex]] = [newFAQs[newIndex], newFAQs[index]];
    // Update order values
    newFAQs.forEach((faq, i) => {
      faq.order = i;
    });
    setSettings({ ...settings, faq: newFAQs });
  };

  // Team Functions
  const updateTeamMember = (index: number, field: string, value: string) => {
    if (!settings) return;
    const newTeam = [...(settings.about?.team || [])];
    newTeam[index] = { ...newTeam[index], [field]: value };
    setSettings({
      ...settings,
      about: { ...settings.about, team: newTeam },
    });
  };

  const addTeamMember = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        team: [
          ...(settings.about?.team || []),
          { name: "", role: "", image: "", bio: "", email: "", phone: "", socialLinks: [] },
        ],
      },
    });
  };

  const addTeamMemberSocialLink = (memberIndex: number) => {
    if (!settings) return;
    const newTeam = [...(settings.about?.team || [])];
    const currentLinks = newTeam[memberIndex]?.socialLinks || [];
    newTeam[memberIndex] = {
      ...newTeam[memberIndex],
      socialLinks: [...currentLinks, { platform: "", url: "" }],
    };
    setSettings({
      ...settings,
      about: { ...settings.about, team: newTeam },
    });
  };

  const updateTeamMemberSocialLink = (
    memberIndex: number,
    linkIndex: number,
    field: string,
    value: string
  ) => {
    if (!settings) return;
    const newTeam = [...(settings.about?.team || [])];
    const currentLinks = [...(newTeam[memberIndex]?.socialLinks || [])];
    currentLinks[linkIndex] = { ...currentLinks[linkIndex], [field]: value };
    newTeam[memberIndex] = { ...newTeam[memberIndex], socialLinks: currentLinks };
    setSettings({
      ...settings,
      about: { ...settings.about, team: newTeam },
    });
  };

  const removeTeamMemberSocialLink = (memberIndex: number, linkIndex: number) => {
    if (!settings) return;
    const newTeam = [...(settings.about?.team || [])];
    const currentLinks = (newTeam[memberIndex]?.socialLinks || []).filter(
      (_, i) => i !== linkIndex
    );
    newTeam[memberIndex] = { ...newTeam[memberIndex], socialLinks: currentLinks };
    setSettings({
      ...settings,
      about: { ...settings.about, team: newTeam },
    });
  };

  const removeTeamMember = (index: number) => {
    if (!settings) return;
    const newTeam = (settings.about?.team || []).filter((_, i) => i !== index);
    setSettings({
      ...settings,
      about: { ...settings.about, team: newTeam },
    });
  };

  // Service Functions
  const updateServiceDescription = (
    serviceKey: "customDesign" | "globalShipping" | "expertSupport" | "qualityControl",
    value: string
  ) => {
    if (!settings) return;
    const currentServices = settings.about?.services || {};
    const currentService = currentServices[serviceKey] || {};
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        services: {
          ...currentServices,
          [serviceKey]: {
            ...currentService,
            description: value,
          },
        },
      },
    });
  };

  const updateServiceFeature = (
    serviceKey: "customDesign" | "globalShipping" | "expertSupport" | "qualityControl",
    featureIndex: number,
    value: string
  ) => {
    if (!settings) return;
    const currentServices = settings.about?.services || {};
    const currentService = currentServices[serviceKey] || {};
    const features = [...(currentService.features || [])];
    features[featureIndex] = value;
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        services: {
          ...currentServices,
          [serviceKey]: {
            ...currentService,
            features,
          },
        },
      },
    });
  };

  const addServiceFeature = (
    serviceKey: "customDesign" | "globalShipping" | "expertSupport" | "qualityControl"
  ) => {
    if (!settings) return;
    const currentServices = settings.about?.services || {};
    const currentService = currentServices[serviceKey] || {};
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        services: {
          ...currentServices,
          [serviceKey]: {
            ...currentService,
            features: [...(currentService.features || []), ""],
          },
        },
      },
    });
  };

  const removeServiceFeature = (
    serviceKey: "customDesign" | "globalShipping" | "expertSupport" | "qualityControl",
    featureIndex: number
  ) => {
    if (!settings) return;
    const currentServices = settings.about?.services || {};
    const currentService = currentServices[serviceKey] || {};
    const features = (currentService.features || []).filter((_, i) => i !== featureIndex);
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        services: {
          ...currentServices,
          [serviceKey]: {
            ...currentService,
            features,
          },
        },
      },
    });
  };

  // Factory Functions
  const addFactoryVideo = () => {
    if (!settings) return;
    const currentFactory = settings.about?.factory || {};
    const currentVideos = currentFactory.videos || [];
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        factory: {
          ...currentFactory,
          videos: [
            ...currentVideos,
            { title: "", url: "", order: currentVideos.length },
          ],
        },
      },
    });
  };

  const updateFactoryVideo = (index: number, field: string, value: string) => {
    if (!settings) return;
    const currentFactory = settings.about?.factory || {};
    const currentVideos = [...(currentFactory.videos || [])];
    currentVideos[index] = { ...currentVideos[index], [field]: value };
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        factory: {
          ...currentFactory,
          videos: currentVideos,
        },
      },
    });
  };

  const removeFactoryVideo = (index: number) => {
    if (!settings) return;
    const currentFactory = settings.about?.factory || {};
    const currentVideos = (currentFactory.videos || []).filter((_, i) => i !== index);
    setSettings({
      ...settings,
      about: {
        ...settings.about,
        factory: {
          ...currentFactory,
          videos: currentVideos,
        },
      },
    });
  };

  // Helper to extract Google Maps URL from embed HTML
  const extractMapUrl = (input: string): string => {
    if (!input) return "";
    // Check if it's an iframe embed code
    const srcMatch = input.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      return srcMatch[1];
    }
    // If it's already a URL, return as is
    if (input.startsWith("http")) {
      return input;
    }
    return input;
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex-1 p-6">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Site Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your website information and configuration
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full sm:grid sm:grid-cols-4 md:grid-cols-8">
          <TabsTrigger value="general" className="flex-1 min-w-[70px]">
            General
          </TabsTrigger>
          <TabsTrigger value="locale" className="flex-1 min-w-[70px]">
            Currency
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1 min-w-[70px]">
            About
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 min-w-[70px]">
            Contact
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-[70px]">
            Hours
          </TabsTrigger>
          <TabsTrigger value="social" className="flex-1 min-w-[70px]">
            Social
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex-1 min-w-[70px]">
            FAQ
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex-1 min-w-[70px]">
            SEO
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                General Information
              </CardTitle>
              <CardDescription>Basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSettings("siteName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.tagline || ""}
                    onChange={(e) => updateSettings("tagline", e.target.value)}
                    placeholder="Your catchy tagline"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logo?.url || ""}
                  onChange={(e) => updateSettings("logo.url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="footerCopyright">Footer Copyright</Label>
                  <Input
                    id="footerCopyright"
                    value={settings.footer?.copyright || ""}
                    onChange={(e) =>
                      updateSettings("footer.copyright", e.target.value)
                    }
                    placeholder="© 2024 Your Company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerDesc">Footer Description</Label>
                  <Input
                    id="footerDesc"
                    value={settings.footer?.description || ""}
                    onChange={(e) =>
                      updateSettings("footer.description", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Support
              </CardTitle>
              <CardDescription>Configure WhatsApp chat support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={settings.support?.whatsappNumber || ""}
                    onChange={(e) =>
                      updateSettings("support.whatsappNumber", e.target.value)
                    }
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappMessage">Default Message</Label>
                  <Input
                    id="whatsappMessage"
                    value={settings.support?.whatsappMessage || ""}
                    onChange={(e) =>
                      updateSettings("support.whatsappMessage", e.target.value)
                    }
                    placeholder="Hello! I have a question."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency & Locale Settings */}
        <TabsContent value="locale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Currency & Locale
              </CardTitle>
              <CardDescription>
                Configure currency and regional settings for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select
                    value={settings.locale?.currency || "INR"}
                    onValueChange={(value) => {
                      const currency = CURRENCIES.find(
                        (c) => c.value === value
                      );
                      if (currency) {
                        // Update all locale fields at once to avoid state race conditions
                        const localeMap: Record<string, string> = {
                          INR: "en-IN",
                          USD: "en-US",
                          EUR: "de-DE",
                          GBP: "en-GB",
                          AED: "ar-AE",
                          SAR: "ar-SA",
                          CAD: "en-CA",
                          AUD: "en-AU",
                          JPY: "ja-JP",
                          CNY: "zh-CN",
                        };
                        setSettings({
                          ...settings,
                          locale: {
                            ...settings.locale,
                            currency: value,
                            currencySymbol: currency.symbol,
                            locale: localeMap[value] || "en-US",
                          },
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The base currency in which product prices are stored
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={settings.locale?.currencySymbol || "₹"}
                    onChange={(e) =>
                      updateSettings("locale.currencySymbol", e.target.value)
                    }
                    placeholder="₹"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="localeCode">Locale Code</Label>
                <Input
                  id="localeCode"
                  value={settings.locale?.locale || "en-IN"}
                  onChange={(e) =>
                    updateSettings("locale.locale", e.target.value)
                  }
                  placeholder="en-IN"
                />
                <p className="text-xs text-muted-foreground">
                  Used for formatting numbers and dates. Examples: en-IN, en-US,
                  en-GB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between md:flex-row flex-col gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Exchange Rates
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshRates}
                  disabled={refreshingRates}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      refreshingRates ? "animate-spin" : ""
                    }`}
                  />
                  {refreshingRates ? "Updating..." : "Fetch Latest Rates"}
                </Button>
              </div>
              <CardDescription>
                Set custom exchange rates relative to USD. These rates are used
                when users view prices in different currencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CURRENCIES.map((currency) => {
                  const currentRate =
                    settings.locale?.exchangeRates?.[currency.value] ??
                    DEFAULT_EXCHANGE_RATES[currency.value] ??
                    1;

                  return (
                    <div key={currency.value} className="space-y-2">
                      <Label
                        htmlFor={`rate-${currency.value}`}
                        className="flex items-center gap-2"
                      >
                        <span className="text-lg">{currency.symbol}</span>
                        <span>{currency.value}</span>
                        {currency.value === "USD" && (
                          <span className="text-xs text-muted-foreground">
                            (Reference)
                          </span>
                        )}
                      </Label>
                      <Input
                        id={`rate-${currency.value}`}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={currentRate}
                        onChange={(e) => {
                          const newRates = {
                            ...DEFAULT_EXCHANGE_RATES,
                            ...(settings.locale?.exchangeRates || {}),
                            [currency.value]: parseFloat(e.target.value) || 0,
                          };
                          updateSettings("locale.exchangeRates", newRates);
                        }}
                        disabled={currency.value === "USD"}
                        className={currency.value === "USD" ? "bg-muted" : ""}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                All rates are relative to USD (1 USD = X currency). For example,
                if 1 USD = 83.5 INR, enter 83.5 for INR.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Settings */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                About Information
              </CardTitle>
              <CardDescription>
                Information shown on the About page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aboutTitle">About Title</Label>
                <Input
                  id="aboutTitle"
                  value={settings.about?.title || ""}
                  onChange={(e) =>
                    updateSettings("about.title", e.target.value)
                  }
                  placeholder="About Our Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutDescription">About Description</Label>
                <Textarea
                  id="aboutDescription"
                  value={settings.about?.description || ""}
                  onChange={(e) =>
                    updateSettings("about.description", e.target.value)
                  }
                  placeholder="Tell your story..."
                  rows={4}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mission">Mission</Label>
                  <Textarea
                    id="mission"
                    value={settings.about?.mission || ""}
                    onChange={(e) =>
                      updateSettings("about.mission", e.target.value)
                    }
                    placeholder="Our mission is..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Vision</Label>
                  <Textarea
                    id="vision"
                    value={settings.about?.vision || ""}
                    onChange={(e) =>
                      updateSettings("about.vision", e.target.value)
                    }
                    placeholder="Our vision is..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Company History
              </CardTitle>
              <CardDescription>
                Share your company&apos;s story and journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="history">Our Story</Label>
                <Textarea
                  id="history"
                  value={settings.about?.history || ""}
                  onChange={(e) =>
                    updateSettings("about.history", e.target.value)
                  }
                  placeholder="Share your company's history and journey..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Add team members to display on the About page
                {(settings.about?.team?.length || 0) > 0 && (
                  <span className="ml-2 text-xs">
                    ({settings.about?.team?.length} total)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const team = settings.about?.team || [];
                const totalPages = Math.ceil(team.length / ITEMS_PER_PAGE);
                const startIndex = (teamPage - 1) * ITEMS_PER_PAGE;
                const paginatedTeam = team.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                return (
                  <>
                    {paginatedTeam.map((member, paginatedIndex) => {
                      const index = startIndex + paginatedIndex;
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-3 p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Team Member #{index + 1}
                            </span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                removeTeamMember(index);
                                // Adjust page if needed
                                const newTotal = team.length - 1;
                                const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                                if (teamPage > newTotalPages && newTotalPages > 0) {
                                  setTeamPage(newTotalPages);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={member.name}
                                onChange={(e) =>
                                  updateTeamMember(index, "name", e.target.value)
                                }
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Input
                                value={member.role}
                                onChange={(e) =>
                                  updateTeamMember(index, "role", e.target.value)
                                }
                                placeholder="CEO / Founder"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Profile Image</Label>
                            <ImagePicker
                              value={
                                member.image
                                  ? {
                                      id: member.image,
                                      name: "Profile Image",
                                      url: member.image,
                                      thumbnailUrl: member.image,
                                    }
                                  : null
                              }
                              onChange={(image: ImageData | ImageData[] | null) => {
                                const singleImage = Array.isArray(image) ? image[0] : image;
                                updateTeamMember(index, "image", singleImage?.url || "");
                              }}
                              multiple={false}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bio</Label>
                            <Textarea
                              value={member.bio || ""}
                              onChange={(e) =>
                                updateTeamMember(index, "bio", e.target.value)
                              }
                              placeholder="Brief bio or description..."
                              rows={2}
                            />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={member.email || ""}
                                onChange={(e) =>
                                  updateTeamMember(index, "email", e.target.value)
                                }
                                placeholder="john@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone</Label>
                              <Input
                                value={member.phone || ""}
                                onChange={(e) =>
                                  updateTeamMember(index, "phone", e.target.value)
                                }
                                placeholder="+1 234 567 8900"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Social Links</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTeamMemberSocialLink(index)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Link
                              </Button>
                            </div>
                            {(member.socialLinks || []).length > 0 ? (
                              <div className="space-y-2">
                                {(member.socialLinks || []).map((link, linkIdx) => (
                                  <div
                                    key={linkIdx}
                                    className="flex flex-col gap-2 p-2 bg-muted/50 rounded-lg sm:flex-row sm:items-center"
                                  >
                                    <Select
                                      value={link.platform || ""}
                                      onValueChange={(value) =>
                                        updateTeamMemberSocialLink(index, linkIdx, "platform", value)
                                      }
                                    >
                                      <SelectTrigger className="w-full sm:w-36">
                                        <SelectValue placeholder="Platform" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TEAM_SOCIAL_PLATFORMS.map((platform) => (
                                          <SelectItem key={platform.value} value={platform.value}>
                                            {platform.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={link.url || ""}
                                      onChange={(e) =>
                                        updateTeamMemberSocialLink(index, linkIdx, "url", e.target.value)
                                      }
                                      placeholder="https://..."
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive shrink-0"
                                      onClick={() => removeTeamMemberSocialLink(index, linkIdx)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No social links added yet
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {teamPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                            disabled={teamPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTeamPage((p) => Math.min(totalPages, p + 1))}
                            disabled={teamPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              <Button
                variant="outline"
                onClick={() => {
                  addTeamMember();
                  // Navigate to last page after adding
                  const newTotal = (settings.about?.team?.length || 0) + 1;
                  const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                  setTeamPage(newTotalPages);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Our Services
              </CardTitle>
              <CardDescription>
                Edit the descriptions and features for each service shown on the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Design */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/15 text-blue-500">
                    <PencilRuler size={20} />
                  </div>
                  <h4 className="font-semibold">Custom Design</h4>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.about?.services?.customDesign?.description || ""}
                    onChange={(e) =>
                      updateServiceDescription("customDesign", e.target.value)
                    }
                    placeholder="Tailored furniture built exactly to your vision..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {(settings.about?.services?.customDesign?.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateServiceFeature("customDesign", idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeServiceFeature("customDesign", idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceFeature("customDesign")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>

              {/* Global Shipping */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/15 text-green-500">
                    <Globe2 size={20} />
                  </div>
                  <h4 className="font-semibold">Global Shipping</h4>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.about?.services?.globalShipping?.description || ""}
                    onChange={(e) =>
                      updateServiceDescription("globalShipping", e.target.value)
                    }
                    placeholder="Reliable worldwide delivery with trusted logistics partners..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {(settings.about?.services?.globalShipping?.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateServiceFeature("globalShipping", idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeServiceFeature("globalShipping", idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceFeature("globalShipping")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expert Support */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-500">
                    <Headset size={20} />
                  </div>
                  <h4 className="font-semibold">Expert Support</h4>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.about?.services?.expertSupport?.description || ""}
                    onChange={(e) =>
                      updateServiceDescription("expertSupport", e.target.value)
                    }
                    placeholder="End-to-end guidance with clear communication..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {(settings.about?.services?.expertSupport?.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateServiceFeature("expertSupport", idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeServiceFeature("expertSupport", idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceFeature("expertSupport")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quality Control */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-500">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-semibold">Quality Control</h4>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={settings.about?.services?.qualityControl?.description || ""}
                    onChange={(e) =>
                      updateServiceDescription("qualityControl", e.target.value)
                    }
                    placeholder="Strict inspections ensure world-class craftsmanship..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {(settings.about?.services?.qualityControl?.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateServiceFeature("qualityControl", idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeServiceFeature("qualityControl", idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceFeature("qualityControl")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factory Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5" />
                Factory & Production
              </CardTitle>
              <CardDescription>
                Showcase your factory, production facilities, and videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="factoryTitle">Section Title</Label>
                  <Input
                    id="factoryTitle"
                    value={settings.about?.factory?.title || ""}
                    onChange={(e) =>
                      updateSettings("about.factory.title", e.target.value)
                    }
                    placeholder="Our Factory"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="factoryDescription">Description</Label>
                <Textarea
                  id="factoryDescription"
                  value={settings.about?.factory?.description || ""}
                  onChange={(e) =>
                    updateSettings("about.factory.description", e.target.value)
                  }
                  placeholder="Describe your production facilities, craftsmanship, and manufacturing process..."
                  rows={4}
                />
              </div>

              {/* Factory Images */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Factory Images
                </Label>
                <ImagePicker
                  value={(settings.about?.factory?.images || []).map((img, index) => ({
                    id: img.url,
                    name: img.alt || `Factory image ${index + 1}`,
                    url: img.url,
                    thumbnailUrl: img.url,
                  }))}
                  onChange={(images) => {
                    if (!settings) return;
                    const imageArray = Array.isArray(images) ? images : images ? [images] : [];
                    const currentFactory = settings.about?.factory || {};
                    setSettings({
                      ...settings,
                      about: {
                        ...settings.about,
                        factory: {
                          ...currentFactory,
                          images: imageArray.map((img, index) => ({
                            url: img.url,
                            alt: img.name || "",
                            order: index,
                          })),
                        },
                      },
                    });
                  }}
                  multiple
                  maxImages={20}
                />
              </div>

              {/* Factory Videos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    YouTube Videos
                    {(settings.about?.factory?.videos?.length || 0) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({settings.about?.factory?.videos?.length} videos)
                      </span>
                    )}
                  </Label>
                  <Button variant="outline" size="sm" onClick={addFactoryVideo}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </div>
                {(settings.about?.factory?.videos?.length || 0) > 0 ? (
                  <div className="space-y-3">
                    {settings.about?.factory?.videos?.map((video, index) => (
                      <div key={index} className="flex gap-3 p-3 border rounded-lg">
                        <div className="flex-1 grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Video Title</Label>
                            <Input
                              value={video.title || ""}
                              onChange={(e) =>
                                updateFactoryVideo(index, "title", e.target.value)
                              }
                              placeholder="Factory Tour"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">YouTube URL</Label>
                            <Input
                              value={video.url || ""}
                              onChange={(e) =>
                                updateFactoryVideo(index, "url", e.target.value)
                              }
                              placeholder="https://youtube.com/watch?v=... or embed URL"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeFactoryVideo(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No videos added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add YouTube URLs (watch or embed format)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Your business contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.contact?.email || ""}
                    onChange={(e) =>
                      updateSettings("contact.email", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.contact?.phone || ""}
                    onChange={(e) =>
                      updateSettings("contact.phone", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  value={settings.contact?.alternatePhone || ""}
                  onChange={(e) =>
                    updateSettings("contact.alternatePhone", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={settings.contact?.address || ""}
                  onChange={(e) =>
                    updateSettings("contact.address", e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.contact?.city || ""}
                    onChange={(e) =>
                      updateSettings("contact.city", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={settings.contact?.state || ""}
                    onChange={(e) =>
                      updateSettings("contact.state", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={settings.contact?.country || ""}
                    onChange={(e) =>
                      updateSettings("contact.country", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={settings.contact?.postalCode || ""}
                    onChange={(e) =>
                      updateSettings("contact.postalCode", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
                <Input
                  id="mapUrl"
                  value={settings.contact?.mapUrl || ""}
                  onChange={(e) =>
                    updateSettings("contact.mapUrl", e.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
              <CardDescription>Set your store operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const hourEntry = settings.businessHours?.find(
                  (h) => h.day === day
                ) || {
                  day,
                  open: "09:00",
                  close: "18:00",
                  isClosed: false,
                };
                const dayIndex =
                  settings.businessHours?.findIndex((h) => h.day === day) ?? -1;

                const updateHour = (field: string, value: string | boolean) => {
                  const hours = [...(settings.businessHours || [])];
                  if (dayIndex >= 0) {
                    hours[dayIndex] = { ...hours[dayIndex], [field]: value };
                  } else {
                    hours.push({
                      day,
                      open: "09:00",
                      close: "18:00",
                      isClosed: false,
                      [field]: value,
                    });
                  }
                  updateSettings("businessHours", hours);
                };

                return (
                  <div
                    key={day}
                    className="flex flex-col gap-2 p-3 border rounded-lg sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-24">{day}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!hourEntry.isClosed}
                          onCheckedChange={(checked) =>
                            updateHour("isClosed", !checked)
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {hourEntry.isClosed ? "Closed" : "Open"}
                        </span>
                      </div>
                    </div>
                    {!hourEntry.isClosed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hourEntry.open}
                          onChange={(e) => updateHour("open", e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hourEntry.close}
                          onChange={(e) => updateHour("close", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Your social media profiles
                {(settings.socialLinks?.length || 0) > 0 && (
                  <span className="ml-2 text-xs">
                    ({settings.socialLinks?.length} total)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const links = settings.socialLinks || [];
                const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);
                const startIndex = (socialPage - 1) * ITEMS_PER_PAGE;
                const paginatedLinks = links.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                return (
                  <>
                    {paginatedLinks.map((link, paginatedIndex) => {
                      const index = startIndex + paginatedIndex;
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-end sm:gap-4"
                        >
                          <div className="flex-1 space-y-2">
                            <Label>Platform</Label>
                            <Select
                              value={link.platform || ""}
                              onValueChange={(value) =>
                                updateSocialLink(index, "platform", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                              <SelectContent>
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <SelectItem
                                    key={platform.value}
                                    value={platform.value}
                                  >
                                    {platform.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-[2] space-y-2">
                            <Label>URL</Label>
                            <Input
                              value={link.url}
                              onChange={(e) =>
                                updateSocialLink(index, "url", e.target.value)
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              removeSocialLink(index);
                              // Adjust page if needed
                              const newTotal = links.length - 1;
                              const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                              if (socialPage > newTotalPages && newTotalPages > 0) {
                                setSocialPage(newTotalPages);
                              }
                            }}
                            className="w-full sm:w-auto text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {socialPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSocialPage((p) => Math.max(1, p - 1))}
                            disabled={socialPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSocialPage((p) => Math.min(totalPages, p + 1))}
                            disabled={socialPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              <Button
                variant="outline"
                onClick={() => {
                  addSocialLink();
                  // Navigate to last page after adding
                  const newTotal = (settings.socialLinks?.length || 0) + 1;
                  const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                  setSocialPage(newTotalPages);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Social Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Settings */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Manage FAQ items shown on your website
                {(settings.faq?.length || 0) > 0 && (
                  <span className="ml-2 text-xs">
                    ({settings.faq?.length} total)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const faqs = settings.faq || [];
                const totalPages = Math.ceil(faqs.length / ITEMS_PER_PAGE);
                const startIndex = (faqPage - 1) * ITEMS_PER_PAGE;
                const paginatedFaqs = faqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                return (
                  <>
                    {paginatedFaqs.map((faq, paginatedIndex) => {
                      const index = startIndex + paginatedIndex;
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-3 p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFAQ(index, "up")}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFAQ(index, "down")}
                                disabled={index === (settings.faq?.length || 0) - 1}
                              >
                                ↓
                              </Button>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={faq.isActive !== false}
                                  onCheckedChange={(checked) =>
                                    updateFAQ(index, "isActive", checked)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">
                                  Active
                                </span>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  removeFAQ(index);
                                  // Adjust page if needed
                                  const newTotal = faqs.length - 1;
                                  const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                                  if (faqPage > newTotalPages && newTotalPages > 0) {
                                    setFaqPage(newTotalPages);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) =>
                                updateFAQ(index, "question", e.target.value)
                              }
                              placeholder="Enter the question..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) =>
                                updateFAQ(index, "answer", e.target.value)
                              }
                              placeholder="Enter the answer..."
                              rows={3}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {faqPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFaqPage((p) => Math.max(1, p - 1))}
                            disabled={faqPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFaqPage((p) => Math.min(totalPages, p + 1))}
                            disabled={faqPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              <Button
                variant="outline"
                onClick={() => {
                  addFAQ();
                  // Navigate to last page after adding
                  const newTotal = (settings.faq?.length || 0) + 1;
                  const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
                  setFaqPage(newTotalPages);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ Item
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Search engine optimization defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo?.metaTitle || ""}
                  onChange={(e) =>
                    updateSettings("seo.metaTitle", e.target.value)
                  }
                  placeholder="Your Site Name - Tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">
                  Default Meta Description
                </Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo?.metaDescription || ""}
                  onChange={(e) =>
                    updateSettings("seo.metaDescription", e.target.value)
                  }
                  placeholder="A brief description of your website..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={settings.seo?.keywords?.join(", ") || ""}
                  onChange={(e) =>
                    updateSettings(
                      "seo.keywords",
                      e.target.value.split(",").map((k) => k.trim())
                    )
                  }
                  placeholder="furniture, home decor, interior design"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
