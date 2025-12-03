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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
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
    },
    image: null as ImageData | null,
    imageAlt: "Hero Banner",
    mobileImage: null as ImageData | null,
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes, prodRes] = await Promise.all([
          fetch(`/api/admin/hero-banners/${id}`),
          fetch("/api/admin/categories?limit=100"),
          fetch("/api/admin/products?limit=100"),
        ]);

        const bannerData = await bannerRes.json();
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (bannerData.success) {
          const b = bannerData.banner;
          setFormData({
            name: b.name || "",
            contentType: b.contentType || "custom",
            sourceType: b.sourceType || "manual",
            content: {
              productId: b.content?.productId?.id || b.content?.productId || "",
              categoryId: b.content?.categoryId?.id || b.content?.categoryId || "",
              title: b.content?.title || "",
              subtitle: b.content?.subtitle || "",
              description: b.content?.description || "",
              ctaText: b.content?.ctaText || "Shop Now",
              ctaLink: b.content?.ctaLink || "",
              discountPercent: b.content?.discountPercent || 0,
              offerCode: b.content?.offerCode || "",
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
            mobileImage: b.image?.mobileUrl ? {
              id: `mobile-${b.image.id || ""}`,
              name: "Mobile Banner",
              url: b.image.mobileUrl,
              thumbnailUrl: b.image.mobileUrl,
              downloadUrl: "",
              size: 0,
              width: 0,
              height: 0,
            } : null,
            order: b.order || 0,
            isActive: b.isActive ?? true,
          });
        }

        if (catData.success) setCategories(catData.categories);
        if (prodData.success) setProducts(prodData.products);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.image) {
        alert("Please select a banner image");
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
          },
          image: {
            id: formData.image.id,
            url: formData.image.url,
            alt: formData.imageAlt,
            mobileUrl: formData.mobileImage?.url || "",
          },
          order: formData.order,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/offers" as Route);
      } else {
        alert(data.error || "Failed to update banner");
      }
    } catch (error) {
      console.error("Failed to update banner:", error);
      alert("Failed to update banner");
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
                    <Select
                      value={formData.content.productId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, productId: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id}>
                            {prod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              {formData.contentType === "offer" && (
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
                  </div>

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
                </div>
              )}
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
