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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: { id: string; name: string };
  isActive: boolean;
}

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    isActive: true,
    image: null as ImageData | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/categories/${id}`),
          fetch("/api/admin/categories?limit=100"),
        ]);

        const categoryData = await categoryRes.json();
        const categoriesData = await categoriesRes.json();

        if (categoryData.success) {
          const cat = categoryData.category;
          setFormData({
            name: cat.name || "",
            slug: cat.slug || "",
            description: cat.description || "",
            parent: cat.parent?.id || "",
            isActive: cat.isActive ?? true,
            image: cat.image ? {
              id: cat.image.id || cat.image._id,
              name: cat.image.name || "",
              url: cat.image.url || "",
              thumbnailUrl: cat.image.thumbnailUrl || "",
              downloadUrl: cat.image.downloadUrl || "",
              size: cat.image.size || 0,
              width: cat.image.width || 0,
              height: cat.image.height || 0,
            } : null,
          });
        }

        if (categoriesData.success) {
          // Filter out current category to prevent self-reference
          setCategories(
            categoriesData.categories.filter((c: Category) => c.id !== id)
          );
        }
      } catch (error) {
        console.error("Failed to fetch category:", error);
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
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parent: formData.parent || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/categories" as Route);
      } else {
        alert(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={"/admin/categories" as Route}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Category</h1>
          <p className="text-sm text-muted-foreground">
            Update category information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  });
                }}
                placeholder="e.g. Living Room Furniture"
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
                placeholder="living-room-furniture"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Be careful when changing.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Brief description of the category..."
              />
            </div>

            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImagePicker
                value={formData.image}
                onChange={(image) =>
                  setFormData({
                    ...formData,
                    image: image as ImageData | null,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional. This image will be displayed in the category header.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional. Create subcategories by selecting a parent.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive categories are hidden from the store
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

        <div className="flex justify-end gap-4">
          <Link href={"/admin/categories" as Route}>
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
