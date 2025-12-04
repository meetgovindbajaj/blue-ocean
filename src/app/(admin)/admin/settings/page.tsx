"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
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

interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: { url: string; alt?: string };
  about: {
    title?: string;
    description?: string;
    mission?: string;
    vision?: string;
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    const newOrder = (settings.faq?.length || 0);
    setSettings({
      ...settings,
      faq: [...(settings.faq || []), { question: "", answer: "", order: newOrder, isActive: true }],
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
    newFAQs.forEach((faq, i) => { faq.order = i; });
    setSettings({ ...settings, faq: newFAQs });
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
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full sm:grid sm:grid-cols-4 md:grid-cols-8">
          <TabsTrigger value="general" className="flex-1 min-w-[70px]">General</TabsTrigger>
          <TabsTrigger value="locale" className="flex-1 min-w-[70px]">Currency</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 min-w-[70px]">About</TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 min-w-[70px]">Contact</TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-[70px]">Hours</TabsTrigger>
          <TabsTrigger value="social" className="flex-1 min-w-[70px]">Social</TabsTrigger>
          <TabsTrigger value="faq" className="flex-1 min-w-[70px]">FAQ</TabsTrigger>
          <TabsTrigger value="seo" className="flex-1 min-w-[70px]">SEO</TabsTrigger>
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
                    onChange={(e) => updateSettings("footer.copyright", e.target.value)}
                    placeholder="© 2024 Your Company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerDesc">Footer Description</Label>
                  <Input
                    id="footerDesc"
                    value={settings.footer?.description || ""}
                    onChange={(e) => updateSettings("footer.description", e.target.value)}
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
                    onChange={(e) => updateSettings("support.whatsappNumber", e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappMessage">Default Message</Label>
                  <Input
                    id="whatsappMessage"
                    value={settings.support?.whatsappMessage || ""}
                    onChange={(e) => updateSettings("support.whatsappMessage", e.target.value)}
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
              <CardDescription>Configure currency and regional settings for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select
                    value={settings.locale?.currency || "INR"}
                    onValueChange={(value) => {
                      const currency = CURRENCIES.find(c => c.value === value);
                      if (currency) {
                        updateSettings("locale.currency", value);
                        updateSettings("locale.currencySymbol", currency.symbol);
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
                    onChange={(e) => updateSettings("locale.currencySymbol", e.target.value)}
                    placeholder="₹"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="localeCode">Locale Code</Label>
                <Input
                  id="localeCode"
                  value={settings.locale?.locale || "en-IN"}
                  onChange={(e) => updateSettings("locale.locale", e.target.value)}
                  placeholder="en-IN"
                />
                <p className="text-xs text-muted-foreground">
                  Used for formatting numbers and dates. Examples: en-IN, en-US, en-GB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Exchange Rates
              </CardTitle>
              <CardDescription>
                Set custom exchange rates relative to USD. These rates are used when users view prices in different currencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CURRENCIES.map((currency) => {
                  const currentRate = settings.locale?.exchangeRates?.[currency.value]
                    ?? DEFAULT_EXCHANGE_RATES[currency.value]
                    ?? 1;

                  return (
                    <div key={currency.value} className="space-y-2">
                      <Label htmlFor={`rate-${currency.value}`} className="flex items-center gap-2">
                        <span className="text-lg">{currency.symbol}</span>
                        <span>{currency.value}</span>
                        {currency.value === "USD" && (
                          <span className="text-xs text-muted-foreground">(Reference)</span>
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
                All rates are relative to USD (1 USD = X currency). For example, if 1 USD = 83.5 INR, enter 83.5 for INR.
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
              <CardDescription>Information shown on the About page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aboutTitle">About Title</Label>
                <Input
                  id="aboutTitle"
                  value={settings.about?.title || ""}
                  onChange={(e) => updateSettings("about.title", e.target.value)}
                  placeholder="About Our Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutDescription">About Description</Label>
                <Textarea
                  id="aboutDescription"
                  value={settings.about?.description || ""}
                  onChange={(e) => updateSettings("about.description", e.target.value)}
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
                    onChange={(e) => updateSettings("about.mission", e.target.value)}
                    placeholder="Our mission is..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Vision</Label>
                  <Textarea
                    id="vision"
                    value={settings.about?.vision || ""}
                    onChange={(e) => updateSettings("about.vision", e.target.value)}
                    placeholder="Our vision is..."
                    rows={3}
                  />
                </div>
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
                    onChange={(e) => updateSettings("contact.email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.contact?.phone || ""}
                    onChange={(e) => updateSettings("contact.phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  value={settings.contact?.alternatePhone || ""}
                  onChange={(e) => updateSettings("contact.alternatePhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={settings.contact?.address || ""}
                  onChange={(e) => updateSettings("contact.address", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.contact?.city || ""}
                    onChange={(e) => updateSettings("contact.city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={settings.contact?.state || ""}
                    onChange={(e) => updateSettings("contact.state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={settings.contact?.country || ""}
                    onChange={(e) => updateSettings("contact.country", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={settings.contact?.postalCode || ""}
                    onChange={(e) => updateSettings("contact.postalCode", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
                <Input
                  id="mapUrl"
                  value={settings.contact?.mapUrl || ""}
                  onChange={(e) => updateSettings("contact.mapUrl", e.target.value)}
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
                const hourEntry = settings.businessHours?.find(h => h.day === day) || {
                  day,
                  open: "09:00",
                  close: "18:00",
                  isClosed: false
                };
                const dayIndex = settings.businessHours?.findIndex(h => h.day === day) ?? -1;

                const updateHour = (field: string, value: string | boolean) => {
                  const hours = [...(settings.businessHours || [])];
                  if (dayIndex >= 0) {
                    hours[dayIndex] = { ...hours[dayIndex], [field]: value };
                  } else {
                    hours.push({ day, open: "09:00", close: "18:00", isClosed: false, [field]: value });
                  }
                  updateSettings("businessHours", hours);
                };

                return (
                  <div key={day} className="flex flex-col gap-2 p-3 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-24">{day}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!hourEntry.isClosed}
                          onCheckedChange={(checked) => updateHour("isClosed", !checked)}
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
              <CardDescription>Your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.socialLinks?.map((link, index) => (
                <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Platform</Label>
                    <Select
                      value={link.platform || ""}
                      onValueChange={(value) => updateSocialLink(index, "platform", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
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
                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
                    className="w-full sm:w-auto text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addSocialLink} className="w-full sm:w-auto">
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
              <CardDescription>Manage FAQ items shown on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(settings.faq || []).map((faq, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
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
                          onCheckedChange={(checked) => updateFAQ(index, "isActive", checked)}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFAQ(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                      placeholder="Enter the question..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      placeholder="Enter the answer..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addFAQ} className="w-full sm:w-auto">
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
              <CardDescription>Search engine optimization defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo?.metaTitle || ""}
                  onChange={(e) => updateSettings("seo.metaTitle", e.target.value)}
                  placeholder="Your Site Name - Tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Default Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo?.metaDescription || ""}
                  onChange={(e) => updateSettings("seo.metaDescription", e.target.value)}
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
