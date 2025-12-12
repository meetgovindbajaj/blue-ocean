"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tag,
  MousePointerClick,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type SortField = "name" | "status" | "clicks" | "createdAt";
type SortDirection = "asc" | "desc";

interface IImage {
  id?: string;
  name?: string;
  url: string;
  thumbnailUrl?: string;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: IImage;
  website?: string;
  isActive: boolean;
  order: number;
  clicks: number;
  createdAt: string;
}

interface TagFormData {
  name: string;
  description: string;
  website: string;
  isActive: boolean;
  logo: ImageData | null;
}

const defaultFormData: TagFormData = {
  name: "",
  description: "",
  website: "",
  isActive: true,
  logo: null,
};

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [formData, setFormData] = useState<TagFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
      });
      const response = await fetch(`/api/admin/tags?${params}`);
      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Client-side sorting
  const sortedTags = [...tags].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
        break;
      case "clicks":
        aValue = a.clicks || 0;
        bValue = b.clicks || 0;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleOpenDialog = (tag?: TagItem) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || "",
        website: tag.website || "",
        isActive: tag.isActive,
        logo: tag.logo
          ? {
              id: tag.logo.id || "",
              name: tag.logo.name || "",
              url: tag.logo.url,
              thumbnailUrl: tag.logo.thumbnailUrl || tag.logo.url,
            }
          : null,
      });
    } else {
      setEditingTag(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);

    try {
      const url = editingTag
        ? `/api/admin/tags/${editingTag.id}`
        : "/api/admin/tags";
      const method = editingTag ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || undefined,
        website: formData.website || undefined,
        isActive: formData.isActive,
        logo: formData.logo
          ? {
              id: formData.logo.id,
              name: formData.logo.name,
              url: formData.logo.url,
              thumbnailUrl: formData.logo.thumbnailUrl,
            }
          : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchTags();
        setDialogOpen(false);
        setFormData(defaultFormData);
        setEditingTag(null);
      }
    } catch (error) {
      console.error("Failed to save tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/tags/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-start justify-between md:flex-row flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-sm text-muted-foreground">
            Manage brand partnerships and affiliates shown on homepage
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>All Tags</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tags found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first tag
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("name")}
                    >
                      Tag
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("clicks")}
                    >
                      Clicks
                      {getSortIcon("clicks")}
                    </Button>
                  </TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {tag.logo?.url ? (
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={tag.logo.thumbnailUrl || tag.logo.url}
                              alt={tag.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <code className="text-xs text-muted-foreground">
                            {tag.slug}
                          </code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                        {tag.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tag.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tag.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        {tag.clicks.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tag.website ? (
                        <a
                          href={tag.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(tag)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteId(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Tag Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "New Tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name *</Label>
              <Input
                id="tagName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Partner Brand"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description (max 20 characters)..."
                rows={2}
                maxLength={20}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shown below tag name on homepage. Keep it short.</span>
                <span>{formData.description.length}/20</span>
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImagePicker
                value={formData.logo}
                onChange={(img) =>
                  setFormData({
                    ...formData,
                    logo: img as ImageData | null,
                  })
                }
                multiple={false}
              />
              <p className="text-xs text-muted-foreground">
                Square logo with rounded corners shown on homepage
              </p>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Clicking the tag redirects to this URL
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Show this tag on the website
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

            {/* Analytics (Read-only, shown when editing) */}
            {editingTag && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MousePointerClick className="h-4 w-4" />
                    <span className="text-sm">Total Clicks</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {editingTag.clicks.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTag}
              disabled={saving || !formData.name.trim()}
            >
              {saving ? "Saving..." : editingTag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tag? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
