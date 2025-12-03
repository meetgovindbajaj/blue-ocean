"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface FAQItem {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
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
    const newSettings = { ...settings };
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
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full sm:grid sm:grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="general" className="flex-1 min-w-[70px]">General</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 min-w-[70px]">About</TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 min-w-[70px]">Contact</TabsTrigger>
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
                <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-end sm:gap-4 sm:p-0 sm:border-0">
                  <div className="flex-1 space-y-2">
                    <Label>Platform</Label>
                    <Input
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                      placeholder="Facebook, Instagram, etc."
                    />
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
                    className="w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addSocialLink} className="w-full sm:w-auto">
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
