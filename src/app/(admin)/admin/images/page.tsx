"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ImageIcon,
  Upload,
  Trash2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Package,
  FolderTree,
  Image as ImageLucide,
  Tag,
  RefreshCw,
  Search,
  X,
  User,
} from "lucide-react";

interface ImageUsage {
  type: "product" | "category" | "banner" | "tag" | "avatar";
  id: string;
  name: string;
  slug?: string;
}

interface CloudinaryImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  size: number;
  width: number;
  height: number;
  usedIn: ImageUsage[];
  isActive: boolean;
}

interface ImageStats {
  total: number;
  active: number;
  unused: number;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "unused">("all");
  const [folder, setFolder] = useState<"blue_ocean" | "avatars">("blue_ocean");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<ImageStats>({ total: 0, active: 0, unused: 0 });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const [deleteImage, setDeleteImage] = useState<CloudinaryImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const fetchImages = useCallback(async (cursor?: string, append = false) => {
    try {
      if (!append) setLoading(true);

      const params = new URLSearchParams({
        filter,
        folder,
        limit: "50",
      });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/admin/images?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setImages((prev) => [...prev, ...data.images]);
        } else {
          setImages(data.images);
        }
        setNextCursor(data.nextCursor || null);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, folder]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchImages();
      } else {
        alert(data.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteImage) return;

    try {
      const response = await fetch(`/api/upload/${encodeURIComponent(deleteImage.id)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setImages((prev) => prev.filter((img) => img.id !== deleteImage.id));
        setDeleteImage(null);
      } else {
        alert(data.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete image");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedImages.size} images?`);
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedImages).map((id) =>
        fetch(`/api/upload/${encodeURIComponent(id)}`, { method: "DELETE" })
      );

      await Promise.allSettled(deletePromises);
      setSelectedImages(new Set());
      fetchImages();
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Some images failed to delete");
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUsageIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="w-3 h-3" />;
      case "category":
        return <FolderTree className="w-3 h-3" />;
      case "banner":
        return <ImageLucide className="w-3 h-3" />;
      case "tag":
        return <Tag className="w-3 h-3" />;
      case "avatar":
        return <User className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getUsageLink = (usage: ImageUsage): string => {
    switch (usage.type) {
      case "product":
        return `/admin/products/${usage.id}`;
      case "category":
        return `/admin/categories/${usage.id}`;
      case "banner":
        return `/admin/offers/banners/${usage.id}`;
      case "tag":
        return `/admin/tags`;
      case "avatar":
        return `/admin/users`;
      default:
        return "#";
    }
  };

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleImageSelection = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  const selectAllUnused = () => {
    const unusedIds = images.filter((img) => !img.isActive).map((img) => img.id);
    setSelectedImages(new Set(unusedIds));
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Image Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage all images uploaded to Cloudinary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchImages()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Images"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Folder Tabs */}
      <Tabs value={folder} onValueChange={(v) => setFolder(v as "blue_ocean" | "avatars")}>
        <TabsList>
          <TabsTrigger value="blue_ocean" className="flex items-center gap-2">
            <ImageLucide className="h-4 w-4" />
            Product Images
          </TabsTrigger>
          <TabsTrigger value="avatars" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Avatars
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Images
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Use
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unused
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-orange-600">{stats.unused}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={filter} onValueChange={(v: "all" | "active" | "unused") => setFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Images</SelectItem>
            <SelectItem value="active">In Use</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
          </SelectContent>
        </Select>
        {selectedImages.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedImages.size} selected
            </span>
            <Button variant="outline" size="sm" onClick={() => setSelectedImages(new Set())}>
              Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}
        {filter === "unused" && stats.unused > 0 && selectedImages.size === 0 && (
          <Button variant="outline" size="sm" onClick={selectAllUnused}>
            Select All Unused
          </Button>
        )}
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No images found</p>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Upload some images to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedImages.has(image.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/20"
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={image.name}
                  fill
                  className="object-cover"
                />
                {/* Selection checkbox */}
                <div
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(image.id);
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedImages.has(image.id)
                        ? "bg-primary border-primary"
                        : "bg-white/80 border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {selectedImages.has(image.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={image.isActive ? "default" : "secondary"} className="text-xs">
                    {image.isActive ? "In Use" : "Unused"}
                  </Badge>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                    }}
                  >
                    View
                  </Button>
                </div>
                {/* Info bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <p className="text-xs text-white truncate">{image.name}</p>
                  <p className="text-xs text-white/70">
                    {image.width}x{image.height} • {formatBytes(image.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {nextCursor && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchImages(nextCursor, true)}
                disabled={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.name}</DialogTitle>
                <DialogDescription>
                  {selectedImage.width}x{selectedImage.height} • {formatBytes(selectedImage.size)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    fill
                    className="object-contain"
                  />
                </div>
                {/* Details */}
                <div className="space-y-4">
                  {/* Public ID */}
                  <div>
                    <p className="text-sm font-medium mb-1">Public ID</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                        {selectedImage.id}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedImage.id, "id")}
                      >
                        {copiedId === "id" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* URL */}
                  <div>
                    <p className="text-sm font-medium mb-1">URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                        {selectedImage.url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedImage.url, "url")}
                      >
                        {copiedId === "url" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* Usage */}
                  <div>
                    <p className="text-sm font-medium mb-2">Used In</p>
                    {selectedImage.usedIn.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Not used anywhere</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedImage.usedIn.map((usage, idx) => (
                          <Link
                            key={idx}
                            href={getUsageLink(usage) as Route}
                            className="flex items-center gap-2 text-sm hover:underline"
                          >
                            {getUsageIcon(usage.type)}
                            <span className="capitalize">{usage.type}:</span>
                            <span>{usage.name}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" asChild>
                  <a href={selectedImage.downloadUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={selectedImage.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Original
                  </a>
                </Button>
                {!selectedImage.isActive && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedImage(null);
                      setDeleteImage(selectedImage);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteImage} onOpenChange={() => setDeleteImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from Cloudinary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
