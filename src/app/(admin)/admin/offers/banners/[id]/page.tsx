"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  prices?: {
    retail: number;
    wholesale: number;
    discount: number;
  };
}

const CONTENT_TYPES = [
  { value: "custom", label: "Custom" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "offer", label: "Special Offer" },
  { value: "trending", label: "Trending Products" },
  { value: "new_arrivals", label: "New Arrivals" },
];

export default function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    contentType: "custom",
    sourceType: "manual",
    content: {
      productId: "",
      categoryId: "",
      title: "",
      subtitle: "",
      description: "",
      ctaText: "Shop Now",
      ctaLink: "",
      discountPercent: 0,
      offerCode: "",
      offerValidUntil: "",
    },
    image: null as ImageData | null,
    imageAlt: "Hero Banner",
    mobileImage: null as ImageData | null,
    order: 0,
    isActive: true,
    startDate: "",
    endDate: "",
  });

  // Helper to generate CTA link based on content type and selection
  const generateCtaLink = (contentType: string, productId: string, categoryId: string, prods: Product[], cats: Category[]): string => {
    switch (contentType) {
      case "product":
        const product = prods.find(p => p.id === productId);
        return product ? `/products/${product.slug}` : "/products";
      case "category":
        const category = cats.find(c => c.id === categoryId);
        return category ? `/category/${category.slug}` : "/categories";
      case "trending":
        return "/products?sort=trending";
      case "new_arrivals":
        return "/products?sort=newest";
      case "offer":
        return "/products?filter=offers";
      default:
        return "";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes, prodRes] = await Promise.all([
          fetch(`/api/admin/hero-banners/${id}`),
          fetch("/api/admin/categories?limit=100"),
          fetch("/api/admin/products?limit=500"),
        ]);

        const bannerData = await bannerRes.json();
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        const loadedCategories = catData.success ? catData.categories : [];
        const loadedProducts = prodData.success ? prodData.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          prices: p.prices,
        })) : [];

        if (catData.success) setCategories(loadedCategories);
        setProducts(loadedProducts);

        if (bannerData.success) {
          const b = bannerData.banner;
          // The API transformer flattens content fields to top level
          // product/category are objects at top level with id property
          const productId = b.product?.id || b.content?.productId?.id || b.content?.productId || "";
          const categoryId = b.category?.id || b.content?.categoryId?.id || b.content?.categoryId || "";
          const contentType = b.contentType || "custom";

          // Generate CTA link if not already set (use top-level ctaLink from transformer)
          let ctaLink = b.ctaLink || b.content?.ctaLink || "";
          if (!ctaLink && contentType !== "custom") {
            ctaLink = generateCtaLink(contentType, productId, categoryId, loadedProducts, loadedCategories);
          }

          // Format dates for datetime-local input
          const formatDateForInput = (dateStr: string | null) => {
            if (!dateStr) return "";
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            name: b.name || "",
            contentType: contentType,
            sourceType: b.sourceType || "manual",
            content: {
              productId: productId,
              categoryId: categoryId,
              // Use top-level fields from transformer, fallback to content for backwards compatibility
              title: b.title || b.content?.title || "",
              subtitle: b.subtitle || b.content?.subtitle || "",
              description: b.description || b.content?.description || "",
              ctaText: b.ctaText || b.content?.ctaText || "Shop Now",
              ctaLink: ctaLink,
              discountPercent: b.discountPercent || b.content?.discountPercent || 0,
              offerCode: b.offerCode || b.content?.offerCode || "",
              offerValidUntil: formatDateForInput(b.offerValidUntil || b.content?.offerValidUntil),
            },
            image: b.image?.id ? {
              id: b.image.id,
              name: b.image.name || "",
              url: b.image.url || "",
              thumbnailUrl: b.image.thumbnailUrl || "",
              downloadUrl: b.image.downloadUrl || "",
              size: b.image.size || 0,
              width: b.image.width || 0,
              height: b.image.height || 0,
            } : null,
            imageAlt: b.image?.alt || "Hero Banner",
            mobileImage: (b.mobileImage?.url || b.image?.mobileUrl) ? {
              id: b.mobileImage?.id || `mobile-${b.image?.id || ""}`,
              name: b.mobileImage?.name || "Mobile Banner",
              url: b.mobileImage?.url || b.image?.mobileUrl,
              thumbnailUrl: b.mobileImage?.thumbnailUrl || b.mobileImage?.url || b.image?.mobileUrl,
              downloadUrl: b.mobileImage?.downloadUrl || "",
              size: b.mobileImage?.size || 0,
              width: b.mobileImage?.width || 0,
              height: b.mobileImage?.height || 0,
            } : null,
            order: b.order || 0,
            isActive: b.isActive ?? true,
            startDate: formatDateForInput(b.startDate),
            endDate: formatDateForInput(b.endDate),
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load banner data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Auto-update CTA link when content type or selection changes (after initial load)
  useEffect(() => {
    if (loading || products.length === 0) return;

    const newCtaLink = generateCtaLink(
      formData.contentType,
      formData.content.productId,
      formData.content.categoryId,
      products,
      categories
    );
    if (newCtaLink && formData.content.ctaLink !== newCtaLink) {
      setFormData(prev => ({
        ...prev,
        content: { ...prev.content, ctaLink: newCtaLink }
      }));
    }
  }, [formData.contentType, formData.content.productId, formData.content.categoryId]);

  // Auto-fill discount when product is selected (for product type banners)
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const discount = product?.prices?.discount || 0;
    const title = product?.name || "";

    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        productId,
        discountPercent: discount,
        title: prev.content.title || title,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.image) {
        toast.error("Please select a banner image");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/hero-banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contentType: formData.contentType,
          sourceType: formData.sourceType,
          content: {
            ...formData.content,
            productId: formData.content.productId || undefined,
            categoryId: formData.content.categoryId || undefined,
            offerValidUntil: formData.content.offerValidUntil || undefined,
          },
          image: {
            id: formData.image.id,
            url: formData.image.url,
            alt: formData.imageAlt,
            thumbnailUrl: formData.image.thumbnailUrl,
            name: formData.image.name,
          },
          mobileImage: formData.mobileImage ? {
            id: formData.mobileImage.id,
            url: formData.mobileImage.url,
            thumbnailUrl: formData.mobileImage.thumbnailUrl || formData.mobileImage.url,
            name: formData.mobileImage.name || "Mobile Banner",
          } : null,
          order: formData.order,
          isActive: formData.isActive,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Banner updated successfully");
        router.push("/admin/offers" as Route);
      } else {
        toast.error(data.error || "Failed to update banner");
      }
    } catch (error) {
      console.error("Failed to update banner:", error);
      toast.error("Failed to update banner");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={"/admin/offers" as Route}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Banner</h1>
          <p className="text-sm text-muted-foreground">
            Update banner settings and content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General banner settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Banner Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Summer Sale Banner"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Show this banner on the homepage
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Image</CardTitle>
              <CardDescription>Select or upload your banner image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Desktop Banner Image *</Label>
                <ImagePicker
                  value={formData.image}
                  onChange={(image) =>
                    setFormData({
                      ...formData,
                      image: image as ImageData | null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageAlt">Alt Text</Label>
                <Input
                  id="imageAlt"
                  value={formData.imageAlt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imageAlt: e.target.value,
                    })
                  }
                  placeholder="Banner description for accessibility"
                />
              </div>

              <div className="space-y-2">
                <Label>Mobile Banner Image (Optional)</Label>
                <ImagePicker
                  value={formData.mobileImage}
                  onChange={(image) =>
                    setFormData({
                      ...formData,
                      mobileImage: image as ImageData | null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Optional mobile-optimized image for smaller screens
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Banner Content</CardTitle>
              <CardDescription>Text and links displayed on the banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {(formData.contentType === "product") && (
                  <div className="space-y-2">
                    <Label htmlFor="productId">Select Product</Label>
                    <SearchableSelect
                      value={formData.content.productId}
                      onValueChange={handleProductSelect}
                      options={products.map((prod) => ({
                        value: prod.id,
                        label: prod.name,
                        description: prod.prices?.discount
                          ? `${prod.prices.discount}% off`
                          : undefined,
                      }))}
                      placeholder="Search for a product..."
                      searchPlaceholder="Type to search products..."
                      emptyMessage="No products found."
                    />
                  </div>
                )}

                {(formData.contentType === "category") && (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Select Category</Label>
                    <Select
                      value={formData.content.categoryId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, categoryId: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.content.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content, title: e.target.value },
                      })
                    }
                    placeholder="Banner headline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.content.subtitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content, subtitle: e.target.value },
                      })
                    }
                    placeholder="Secondary text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.content.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, description: e.target.value },
                    })
                  }
                  rows={2}
                  placeholder="Additional details..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.content.ctaText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content, ctaText: e.target.value },
                      })
                    }
                    placeholder="Shop Now"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctaLink">Button Link</Label>
                  <Input
                    id="ctaLink"
                    value={formData.content.ctaLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content, ctaLink: e.target.value },
                      })
                    }
                    placeholder="/products or /categories/living-room"
                  />
                </div>
              </div>

              {(formData.contentType === "offer" || formData.contentType === "product") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount %</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.content.discountPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            discountPercent: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    {formData.contentType === "product" && (
                      <p className="text-xs text-muted-foreground">
                        This will update the product&apos;s discount
                      </p>
                    )}
                  </div>

                  {formData.contentType === "offer" && (
                    <div className="space-y-2">
                      <Label htmlFor="offerCode">Offer Code</Label>
                      <Input
                        id="offerCode"
                        value={formData.content.offerCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: { ...formData.content, offerCode: e.target.value },
                          })
                        }
                        placeholder="SUMMER20"
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.contentType === "offer" && (
                <div className="space-y-2">
                  <Label htmlFor="offerValidUntil">Offer Expires</Label>
                  <Input
                    id="offerValidUntil"
                    type="datetime-local"
                    value={formData.content.offerValidUntil}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content, offerValidUntil: e.target.value },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    When the offer expires (displayed on the banner)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Control when this banner is shown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show immediately
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show indefinitely
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={"/admin/offers" as Route}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
