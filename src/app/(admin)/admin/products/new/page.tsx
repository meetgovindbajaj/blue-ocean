"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    images: [] as ImageData[],
    prices: {
      retail: 0,
      wholesale: 0,
      discount: 0,
    },
    size: {
      length: 0,
      width: 0,
      height: 0,
      unit: "cm" as "cm" | "mm" | "in" | "ft",
      fixedSize: false,
    },
    isActive: true,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?limit=100");
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product created successfully");
        router.push("/admin/products" as Route);
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate discount based on retail and wholesale price difference
  const calculateDiscountFromPrices = (
    retail: number,
    wholesale: number
  ): number => {
    if (retail > 0 && wholesale > 0 && retail > wholesale) {
      return Math.round(((retail - wholesale) / retail) * 100);
    }
    return 0;
  };

  // Handler for retail price change - auto-calculate discount
  const handleRetailPriceChange = (value: number) => {
    const newDiscount = calculateDiscountFromPrices(
      value,
      formData.prices.wholesale
    );
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
    const newDiscount = calculateDiscountFromPrices(
      formData.prices.retail,
      value
    );
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
      const newWholesale = Math.round(
        formData.prices.retail * (1 - discount / 100)
      );
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={"/admin/products" as Route}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Product</h1>
          <p className="text-sm text-muted-foreground">
            Create a new product in your catalog
          </p>
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
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
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
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
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
                  onChange={(e) =>
                    handleRetailPriceChange(parseFloat(e.target.value) || 0)
                  }
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
                  onChange={(e) =>
                    handleWholesalePriceChange(parseFloat(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated based on discount, or enter to auto-calculate
                  discount
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
                  onChange={(e) =>
                    handleDiscountChange(parseInt(e.target.value) || 0)
                  }
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
              Click on an image and select &quot;Set Thumb&quot; to mark it as
              the thumbnail.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={"/admin/products" as Route}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
