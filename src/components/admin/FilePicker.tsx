"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileIcon,
  Upload,
  X,
  RefreshCw,
  FileText,
  ExternalLink,
} from "lucide-react";

export interface FileData {
  id: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

interface FilePickerProps {
  value?: FileData | null;
  onChange: (file: FileData | null) => void;
  accept?: string;
  label?: string;
  description?: string;
}

export default function FilePicker({
  value,
  onChange,
  accept = ".pdf",
  label = "PDF Document",
  description = "Upload a PDF file",
}: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blue_ocean/documents");
      formData.append("resource_type", "raw");

      const response = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onChange({
          id: data.file.id,
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          mimeType: data.file.mimeType,
        });
        setOpen(false);
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {/* Current File Preview */}
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.name}</p>
            {value.size && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(value.size)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-muted-foreground/10 rounded-md transition-colors"
              title="View file"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
              title="Remove file"
            >
              <X className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload {label.toLowerCase()}
              </span>
            </button>
          </DialogTrigger>
          <FilePickerDialog />
        </Dialog>
      )}

      {/* Replace button when file exists */}
      {value && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Replace File
            </Button>
          </DialogTrigger>
          <FilePickerDialog />
        </Dialog>
      )}
    </div>
  );

  function FilePickerDialog() {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload {label}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <label className="cursor-pointer w-full">
            <input
              type="file"
              accept={accept}
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-3 transition-colors">
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
                    Click to upload a file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {accept === ".pdf"
                      ? "PDF files only, up to 20MB"
                      : `Accepted formats: ${accept}`}
                  </span>
                </>
              )}
            </div>
          </label>
        </div>
      </DialogContent>
    );
  }
}
