"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ImageIcon,
  Upload,
  X,
  Check,
  Search,
  RefreshCw,
  Plus,
  GripVertical,
} from "lucide-react";

export interface ImageData {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  isThumbnail?: boolean;
  downloadUrl?: string;
  size?: number;
  width?: number;
  height?: number;
}

interface ImagePickerProps {
  value?: ImageData | ImageData[] | null;
  onChange: (images: ImageData | ImageData[] | null) => void;
  multiple?: boolean;
  maxImages?: number;
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
  isActive: boolean;
}

export default function ImagePicker({
  value,
  onChange,
  multiple = false,
  maxImages = 10,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  // Normalize value to array for internal use
  const currentImages: ImageData[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/images?limit=100");
      const data = await response.json();
      if (data.success) {
        setCloudinaryImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchImages();
      // Pre-select current images
      const currentIds = new Set(currentImages.map((img) => img.id));
      setSelectedImages(currentIds);
    }
  }, [open, fetchImages]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", "blue_ocean");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newImages: ImageData[] = data.images;

        if (multiple) {
          // Add new images to selection
          const combined = [...currentImages, ...newImages].slice(0, maxImages);
          onChange(combined);
          // Update selection
          const newIds = new Set(combined.map((img) => img.id));
          setSelectedImages(newIds);
        } else {
          // Single image - replace
          onChange(newImages[0]);
          setSelectedImages(new Set([newImages[0].id]));
        }

        // Refresh library
        fetchImages();
        setActiveTab("library");
      } else {
        alert(data.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const toggleImageSelection = (image: CloudinaryImage) => {
    const newSelected = new Set(selectedImages);

    if (newSelected.has(image.id)) {
      newSelected.delete(image.id);
    } else {
      if (!multiple) {
        newSelected.clear();
      } else if (newSelected.size >= maxImages) {
        return; // Don't add more
      }
      newSelected.add(image.id);
    }

    setSelectedImages(newSelected);
  };

  const handleConfirm = () => {
    const selected = cloudinaryImages.filter((img) => selectedImages.has(img.id));
    const imageData: ImageData[] = selected.map((img) => ({
      id: img.id,
      name: img.name,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      downloadUrl: img.downloadUrl,
      size: img.size,
      width: img.width,
      height: img.height,
      isThumbnail: false,
    }));

    if (multiple) {
      onChange(imageData);
    } else {
      onChange(imageData[0] || null);
    }
    setOpen(false);
  };

  const handleRemoveImage = (id: string) => {
    if (multiple) {
      const filtered = currentImages.filter((img) => img.id !== id);
      onChange(filtered.length > 0 ? filtered : null);
    } else {
      onChange(null);
    }
  };

  const setAsThumbnail = (id: string) => {
    if (!multiple) return;
    const updated = currentImages.map((img) => ({
      ...img,
      isThumbnail: img.id === id,
    }));
    onChange(updated);
  };

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    // Add a slight delay to allow the drag image to be created
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...currentImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const filteredImages = cloudinaryImages.filter(
    (img) =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Current Images Preview */}
      {currentImages.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {currentImages.map((img, index) => (
            <div
              key={img.id}
              draggable={multiple}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group w-24 h-24 rounded-lg overflow-hidden border-2 bg-muted transition-all ${
                img.isThumbnail ? "border-primary" : "border-muted"
              } ${draggedIndex === index ? "opacity-50" : ""} ${
                dragOverIndex === index ? "ring-2 ring-primary ring-offset-2" : ""
              } ${multiple ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Drag handle indicator */}
              {multiple && (
                <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                </div>
              )}
              {/* Order number */}
              {multiple && (
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded z-10">
                  {index + 1}
                </div>
              )}
              <Image
                src={img.thumbnailUrl || img.url}
                alt={img.name}
                fill
                className="object-contain p-1"
                draggable={false}
              />
              {img.isThumbnail && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                  Thumb
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {multiple && !img.isThumbnail && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={() => setAsThumbnail(img.id)}
                  >
                    Set Thumb
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  onClick={() => handleRemoveImage(img.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {multiple && currentImages.length < maxImages && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <ImagePickerDialog />
            </Dialog>
          )}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select {multiple ? "images" : "an image"}
              </span>
            </button>
          </DialogTrigger>
          <ImagePickerDialog />
        </Dialog>
      )}

      {/* Replace button for single image */}
      {!multiple && currentImages.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Replace Image
            </Button>
          </DialogTrigger>
          <ImagePickerDialog />
        </Dialog>
      )}
    </div>
  );

  function ImagePickerDialog() {
    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {multiple ? "Images" : "Image"}</DialogTitle>
          <DialogDescription>
            Choose from your library or upload new {multiple ? "images" : "image"}
            {multiple && ` (max ${maxImages})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "library" | "upload")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Image Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden mt-4">
            {/* Search & Refresh */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchImages}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No images found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => toggleImageSelection(image)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted ${
                        selectedImages.has(image.id)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <Image
                        src={image.thumbnailUrl || image.url}
                        alt={image.name}
                        fill
                        className="object-contain p-1"
                      />
                      {selectedImages.has(image.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selection info & Confirm */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-muted-foreground">
                {selectedImages.size} selected
                {multiple && ` (max ${maxImages})`}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={selectedImages.size === 0}
                >
                  {multiple ? "Add Selected" : "Select Image"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple={multiple}
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-64 h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-3 transition-colors">
                  {uploading ? (
                    <>
                      <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload {multiple ? "images" : "an image"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    );
  }
}
