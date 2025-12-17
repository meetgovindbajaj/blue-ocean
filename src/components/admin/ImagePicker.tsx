"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
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

const IMAGES_PER_PAGE = 30;

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
  const [customImageName, setCustomImageName] = useState("");
  const [nameCheckStatus, setNameCheckStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const nameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursorHistoryRef = useRef<(string | null)[]>([null]);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize value to array for internal use - memoized
  const currentImages: ImageData[] = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);

  const fetchImages = useCallback(async (cursor?: string | null, isNewFetch = false, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: IMAGES_PER_PAGE.toString() });
      if (cursor) {
        params.append("cursor", cursor);
      }
      // Use provided search or current searchQuery
      const searchTerm = search !== undefined ? search : searchQuery;
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await fetch(`/api/admin/images?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setCloudinaryImages(data.images);
        setNextCursor(data.nextCursor || null);
        if (isNewFetch) {
          setCurrentPage(1);
          cursorHistoryRef.current = [null];
        }
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleNextPage = useCallback(() => {
    if (nextCursor) {
      cursorHistoryRef.current = [...cursorHistoryRef.current, nextCursor];
      setCurrentPage(prev => prev + 1);
      fetchImages(nextCursor);
    }
  }, [nextCursor, fetchImages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      const newHistory = [...cursorHistoryRef.current];
      newHistory.pop();
      const prevCursor = newHistory[newHistory.length - 1];
      cursorHistoryRef.current = newHistory;
      setCurrentPage(prev => prev - 1);
      fetchImages(prevCursor);
    }
  }, [currentPage, fetchImages]);

  // Fetch images only when dialog opens for the first time
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (open && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchImages();
    }

    // Reset state when dialog closes
    if (!open) {
      hasInitializedRef.current = false;
      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Reset search query
      setSearchQuery("");
      setIsSearching(false);
    }
  }, [open, fetchImages]);

  // Pre-select current images when dialog opens
  useEffect(() => {
    if (open) {
      const currentIds = new Set(currentImages.map((img) => img.id));
      setSelectedImages(currentIds);
    }
  }, [open, currentImages]);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", "blue_ocean");
      if (customImageName.trim()) {
        formData.append("customName", customImageName.trim());
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newImages: ImageData[] = data.images;

        if (multiple) {
          const combined = [...currentImages, ...newImages].slice(0, maxImages);
          onChange(combined);
          const newIds = new Set(combined.map((img) => img.id));
          setSelectedImages(newIds);
        } else {
          onChange(newImages[0]);
          setSelectedImages(new Set([newImages[0].id]));
        }

        fetchImages(null, true);
        setActiveTab("library");
        setCustomImageName("");
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
  }, [customImageName, multiple, currentImages, maxImages, onChange, fetchImages]);

  const toggleImageSelection = useCallback((image: CloudinaryImage) => {
    setSelectedImages(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(image.id)) {
        newSelected.delete(image.id);
      } else {
        if (!multiple) {
          newSelected.clear();
        } else if (newSelected.size >= maxImages) {
          return prev;
        }
        newSelected.add(image.id);
      }
      return newSelected;
    });
  }, [multiple, maxImages]);

  const handleConfirm = useCallback(() => {
    const selected = cloudinaryImages.filter((img) =>
      selectedImages.has(img.id)
    );
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
  }, [cloudinaryImages, selectedImages, multiple, onChange]);

  const handleRemoveImage = useCallback((id: string) => {
    if (multiple) {
      const filtered = currentImages.filter((img) => img.id !== id);
      onChange(filtered.length > 0 ? filtered : null);
    } else {
      onChange(null);
    }
  }, [multiple, currentImages, onChange]);

  const setAsThumbnail = useCallback((id: string) => {
    if (!multiple) return;
    const updated = currentImages.map((img) => ({
      ...img,
      isThumbnail: img.id === id,
    }));
    onChange(updated);
  }, [multiple, currentImages, onChange]);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.5";
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(prev => prev !== index ? index : prev);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...currentImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, currentImages, onChange]);

  const handleRefresh = useCallback(() => {
    fetchImages(null, true);
  }, [fetchImages]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // Clear previous search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the server-side search
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      // Reset pagination when search changes
      setCurrentPage(1);
      cursorHistoryRef.current = [null];
      fetchImages(null, true, newValue);
    }, 400);
  }, [fetchImages]);

  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameCheckStatus("idle");
      return;
    }

    setNameCheckStatus("checking");
    try {
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
      const response = await fetch(`/api/upload/check-name?name=${encodeURIComponent(sanitizedName)}`);
      const data = await response.json();
      setNameCheckStatus(data.available ? "available" : "taken");
    } catch (error) {
      console.error("Name check error:", error);
      setNameCheckStatus("idle");
    }
  }, []);

  const handleCustomNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCustomImageName(newName);

    // Clear previous timeout
    if (nameCheckTimeoutRef.current) {
      clearTimeout(nameCheckTimeoutRef.current);
    }

    // Debounce the name check
    if (newName.trim()) {
      nameCheckTimeoutRef.current = setTimeout(() => {
        checkNameAvailability(newName);
      }, 500);
    } else {
      setNameCheckStatus("idle");
    }
  }, [checkNameAvailability]);

  const handleTabChange = useCallback((v: string) => {
    setActiveTab(v as "library" | "upload");
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  // Dialog content as inline JSX (not a separate function component)
  const dialogContent = (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Select {multiple ? "Images" : "Image"}</DialogTitle>
        <DialogDescription>
          Choose from your library or upload new{" "}
          {multiple ? "images" : "image"}
          {multiple && ` (max ${maxImages})`}
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Image Library</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        <TabsContent
          value="library"
          className="flex-1 flex flex-col overflow-hidden mt-4"
        >
          {/* Search & Refresh */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Search all images by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
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
            ) : cloudinaryImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No images match your search" : "No images found"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {cloudinaryImages.map((image) => (
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
                      sizes="(max-width: 768px) 25vw, 16vw"
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

          {/* Pagination Controls */}
          {(currentPage > 1 || nextCursor) && (
            <div className="flex items-center justify-center gap-2 pt-3 border-t mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!nextCursor || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Selection info & Confirm */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <span className="text-sm text-muted-foreground">
              {selectedImages.size} selected
              {multiple && ` (max ${maxImages})`}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
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

        <TabsContent
          value="upload"
          className="flex-1 flex flex-col items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="w-64 space-y-2">
              <label className="text-sm font-medium text-left block">
                Custom Name (optional)
              </label>
              <div className="relative">
                <Input
                  value={customImageName}
                  onChange={handleCustomNameChange}
                  placeholder="e.g., product-hero-banner"
                  disabled={uploading}
                  className={`text-sm pr-8 ${
                    nameCheckStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : ""
                  } ${nameCheckStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                />
                {nameCheckStatus === "checking" && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
                {nameCheckStatus === "available" && (
                  <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {nameCheckStatus === "taken" && (
                  <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
              {nameCheckStatus === "taken" ? (
                <p className="text-xs text-destructive text-left">
                  This name is already taken. Please choose another.
                </p>
              ) : nameCheckStatus === "available" ? (
                <p className="text-xs text-green-600 text-left">
                  Name is available!
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-left">
                  Give your image a custom identifier name
                </p>
              )}
            </div>
            <label className="cursor-pointer block">
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
                    <span className="text-sm text-muted-foreground">
                      Uploading...
                    </span>
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
                dragOverIndex === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
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
                src={img.url || img.thumbnailUrl}
                alt={img.name}
                fill
                className="object-contain p-1"
                draggable={false}
                sizes="96px"
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
              {dialogContent}
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
          {dialogContent}
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
          {dialogContent}
        </Dialog>
      )}
    </div>
  );
}
