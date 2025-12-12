"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FileImage,
  File,
  Type,
  Loader2,
  Save,
  X,
  Upload,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImagePicker, { ImageData } from "@/components/admin/ImagePicker";
import FilePicker, { FileData } from "@/components/admin/FilePicker";

type LegalDocumentType =
  | "terms-and-conditions"
  | "privacy-policy"
  | "terms-of-service"
  | "refund-policy"
  | "warranty"
  | "trade-contracts"
  | "certificates";

type ContentFormat = "rich-text" | "pdf" | "image";

interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  title: string;
  slug: string;
  format: ContentFormat;
  content?: string;
  file?: {
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
  images?: {
    url: string;
    name: string;
    order: number;
  }[];
  isVisible: boolean;
  order: number;
  updatedAt: string;
}

const DOCUMENT_TYPES: { value: LegalDocumentType; label: string }[] = [
  { value: "terms-and-conditions", label: "Terms & Conditions" },
  { value: "privacy-policy", label: "Privacy Policy" },
  { value: "terms-of-service", label: "Terms of Service" },
  { value: "refund-policy", label: "Refund Policy" },
  { value: "warranty", label: "Warranty" },
  { value: "trade-contracts", label: "Trade & Contracts" },
  { value: "certificates", label: "Certificates" },
];

const FORMAT_OPTIONS: { value: ContentFormat; label: string; icon: any }[] = [
  { value: "rich-text", label: "Rich Text", icon: Type },
  { value: "pdf", label: "PDF Document", icon: File },
  { value: "image", label: "Images", icon: FileImage },
];

export default function LegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    type: LegalDocumentType;
    title: string;
    format: ContentFormat;
    content: string;
    file: { url: string; name: string } | null;
    images: { url: string; name: string; order: number }[];
    isVisible: boolean;
    order: number;
  }>({
    type: "terms-and-conditions",
    title: "",
    format: "rich-text",
    content: "",
    file: null,
    images: [],
    isVisible: false,
    order: 0,
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/legal-documents");
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenDialog = (doc?: LegalDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        type: doc.type,
        title: doc.title,
        format: doc.format,
        content: doc.content || "",
        file: doc.file || null,
        images: doc.images || [],
        isVisible: doc.isVisible,
        order: doc.order,
      });
    } else {
      setEditingDoc(null);
      // Find available type
      const usedTypes = documents.map((d) => d.type);
      const availableType = DOCUMENT_TYPES.find((t) => !usedTypes.includes(t.value));
      setFormData({
        type: availableType?.value || "terms-and-conditions",
        title: availableType?.label || "",
        format: "rich-text",
        content: "",
        file: null,
        images: [],
        isVisible: false,
        order: documents.length,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingDoc
        ? `/api/admin/legal-documents/${editingDoc.id}`
        : "/api/admin/legal-documents";
      const method = editingDoc ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingDoc ? "Document updated" : "Document created");
        setDialogOpen(false);
        fetchDocuments();
      } else {
        toast.error(data.error || "Failed to save document");
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/legal-documents/${deleteId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Document deleted");
        fetchDocuments();
      } else {
        toast.error(data.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleVisibility = async (doc: LegalDocument) => {
    try {
      const response = await fetch(`/api/admin/legal-documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !doc.isVisible }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(doc.isVisible ? "Document hidden" : "Document visible");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };


  const handlePdfSelect = (file: FileData | null) => {
    setFormData((prev) => ({
      ...prev,
      file: file
        ? {
            url: file.url,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
          }
        : null,
    }));
  };

  const getFormatIcon = (format: ContentFormat) => {
    const option = FORMAT_OPTIONS.find((f) => f.value === format);
    const Icon = option?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const usedTypes = documents.map((d) => d.type);
  const availableTypes = DOCUMENT_TYPES.filter(
    (t) => !usedTypes.includes(t.value) || editingDoc?.type === t.value
  );

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Legal Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage terms, policies, warranties, and certificates
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} disabled={availableTypes.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            Toggle visibility to show/hide documents on the website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No legal documents created yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {getFormatIcon(doc.format)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {FORMAT_OPTIONS.find((f) => f.value === doc.format)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`visible-${doc.id}`} className="text-sm text-muted-foreground">
                        {doc.isVisible ? "Visible" : "Hidden"}
                      </Label>
                      <Switch
                        id={`visible-${doc.id}`}
                        checked={doc.isVisible}
                        onCheckedChange={() => handleToggleVisibility(doc)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(doc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteId(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? "Edit Document" : "Create Document"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: LegalDocumentType) => {
                    const typeOption = DOCUMENT_TYPES.find((t) => t.value === value);
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                      title: prev.title || typeOption?.label || "",
                    }));
                  }}
                  disabled={!!editingDoc}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Document title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content Format</Label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <Button
                      key={format.value}
                      type="button"
                      variant={formData.format === format.value ? "default" : "outline"}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, format: format.value }))
                      }
                      className="flex-1"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {format.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Rich Text Content */}
            {formData.format === "rich-text" && (
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, content: value }))
                  }
                  placeholder="Enter document content..."
                  minHeight="400px"
                />
              </div>
            )}

            {/* PDF Upload */}
            {formData.format === "pdf" && (
              <div className="space-y-4">
                <Label>PDF Document</Label>
                <FilePicker
                  value={
                    formData.file
                      ? {
                          id: formData.file.url,
                          name: formData.file.name,
                          url: formData.file.url,
                          size: formData.file.size,
                          mimeType: formData.file.mimeType,
                        }
                      : null
                  }
                  onChange={handlePdfSelect}
                  accept=".pdf"
                  label="PDF Document"
                  description="Upload a PDF file (max 20MB)"
                />
              </div>
            )}

            {/* Image Upload */}
            {formData.format === "image" && (
              <div className="space-y-4">
                <Label>Images</Label>
                <ImagePicker
                  value={formData.images.map((img, index) => ({
                    id: img.url,
                    name: img.name,
                    url: img.url,
                    thumbnailUrl: img.url,
                  }))}
                  onChange={(images) => {
                    const imageArray = Array.isArray(images) ? images : images ? [images] : [];
                    setFormData((prev) => ({
                      ...prev,
                      images: imageArray.map((img, index) => ({
                        url: img.url,
                        name: img.name,
                        order: index,
                      })),
                    }));
                  }}
                  multiple
                  maxImages={20}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isVisible: checked }))
                }
              />
              <Label htmlFor="isVisible">Show on website</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
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
