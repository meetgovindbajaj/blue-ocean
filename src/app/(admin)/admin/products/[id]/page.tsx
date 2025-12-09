"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  images: ImageData[];
  prices: {
    retail: number;
    wholesale: number;
    discount: number;
  };
  size: {
    length: number;
    width: number;
    height: number;
    unit: "cm" | "mm" | "in" | "ft";
    fixedSize: boolean;
  };
  isActive: boolean;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    category: "",
    images: [],
    prices: {
      retail: 0,
      wholesale: 0,
      discount: 0,
    },
    size: {
      length: 0,
      width: 0,
      height: 0,
      unit: "cm",
      fixedSize: false,
    },
    isActive: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/categories?limit=100"),
        ]);

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        if (productData.success) {
          const p = productData.product;
          setFormData({
            name: p.name || "",
            slug: p.slug || "",
            description: p.description || "",
            category: p.category?.id || p.category?._id || "",
            images: (p.images || []).map((img: any) => ({
              id: img.id || img._id,
              name: img.name || "",
              url: img.url || "",
              thumbnailUrl: img.thumbnailUrl || "",
              isThumbnail: img.isThumbnail || false,
              downloadUrl: img.downloadUrl || "",
              size: img.size || 0,
              width: img.width || 0,
              height: img.height || 0,
            })),
            prices: {
              retail: p.prices?.retail || 0,
              wholesale: p.prices?.wholesale || 0,
              discount: p.prices?.discount || 0,
            },
            size: {
              length: p.size?.length || 0,
              width: p.size?.width || 0,
              height: p.size?.height || 0,
              unit: p.size?.unit || "cm",
              fixedSize: p.size?.fixedSize || false,
            },
            isActive: p.isActive ?? true,
          });
        }

        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
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
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product updated successfully");
        router.push("/admin/products" as Route);
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  // Auto-calculate discount based on retail and wholesale price difference
  const calculateDiscountFromPrices = (retail: number, wholesale: number): number => {
    if (retail > 0 && wholesale > 0 && retail > wholesale) {
      return Math.round(((retail - wholesale) / retail) * 100);
    }
    return 0;
  };

  // Handler for retail price change - auto-calculate discount
  const handleRetailPriceChange = (value: number) => {
    const newDiscount = calculateDiscountFromPrices(value, formData.prices.wholesale);
    setFormData({
      ...formData,
      prices: {
        ...formData.prices,
        retail: value,
        discount: newDiscount,
      },
    });
  };

  // Handler for wholesale price change - auto-calculate discount
  const handleWholesalePriceChange = (value: number) => {
    const newDiscount = calculateDiscountFromPrices(formData.prices.retail, value);
    setFormData({
      ...formData,
      prices: {
        ...formData.prices,
        wholesale: value,
        discount: newDiscount,
      },
    });
  };

  // Handler for discount change - auto-calculate wholesale price
  const handleDiscountChange = (discount: number) => {
    if (discount > 0 && formData.prices.retail > 0) {
      const newWholesale = Math.round(formData.prices.retail * (1 - discount / 100));
      setFormData({
        ...formData,
        prices: {
          ...formData.prices,
          discount,
          wholesale: newWholesale,
        },
      });
    } else {
      setFormData({
        ...formData,
        prices: {
          ...formData.prices,
          discount,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={"/admin/products" as Route}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">{formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  placeholder="Enter product description..."
                  minHeight="150px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
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

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
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

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retail">Retail Price *</Label>
                <Input
                  id="retail"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prices.retail}
                  onChange={(e) => handleRetailPriceChange(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesale">Wholesale Price</Label>
                <Input
                  id="wholesale"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prices.wholesale}
                  onChange={(e) => handleWholesalePriceChange(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated based on discount, or enter to auto-calculate discount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.prices.discount}
                  onChange={(e) => handleDiscountChange(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from retail/wholesale difference
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Size */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    min="0"
                    value={formData.size.length}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size: {
                          ...formData.size,
                          length: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    min="0"
                    value={formData.size.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size: {
                          ...formData.size,
                          width: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    value={formData.size.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size: {
                          ...formData.size,
                          height: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.size.unit}
                  onValueChange={(value: "cm" | "mm" | "in" | "ft") =>
                    setFormData({
                      ...formData,
                      size: { ...formData.size, unit: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                    <SelectItem value="ft">Feet (ft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="fixedSize">Fixed Size</Label>
                <Switch
                  id="fixedSize"
                  checked={formData.size.fixedSize}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      size: { ...formData.size, fixedSize: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImagePicker
              value={formData.images}
              onChange={(images) =>
                setFormData({
                  ...formData,
                  images: (images as ImageData[]) || [],
                })
              }
              multiple
              maxImages={10}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Drag images to reorder. Click on an image and select &quot;Set Thumb&quot; to mark it as the thumbnail. Images are displayed in the product details page in this order.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={"/admin/products" as Route}>
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
