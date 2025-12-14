"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Eye,
  MousePointer,
  Percent,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

type BannerSortField = "name" | "type" | "order" | "impressions" | "clicks" | "status";
type ProductSortField = "name" | "category" | "discount" | "status";
type SortDirection = "asc" | "desc";

interface HeroBanner {
  id: string;
  name: string;
  contentType: string;
  image: { url: string; alt: string };
  order: number;
  isActive: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
}

interface ProductDiscount {
  id: string;
  name: string;
  prices: { retail: number; discount: number; wholesale: number };
  category?: { name: string };
  isActive: boolean;
}

// Sortable Banner Row Component
function SortableBannerRow({
  banner,
  onToggleActive,
  onDelete,
}: {
  banner: HeroBanner;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {banner.image?.url ? (
          <Image
            src={banner.image.url}
            alt={banner.image.alt || banner.name}
            width={80}
            height={45}
            className="rounded object-cover"
          />
        ) : (
          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <p className="font-medium">{banner.name}</p>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{banner.contentType}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{banner.order}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {banner.impressions || 0}
          </span>
          <span className="flex items-center gap-1">
            <MousePointer className="h-3 w-3" />
            {banner.clicks || 0}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Switch
          checked={banner.isActive}
          onCheckedChange={(checked) => onToggleActive(banner.id, checked)}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/offers/banners/${banner.id}` as Route}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(banner.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function OffersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<
    ProductDiscount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"banner" | "product">("banner");
  const [deleting, setDeleting] = useState(false);
  const [bannerSortField, setBannerSortField] = useState<BannerSortField>("order");
  const [bannerSortDirection, setBannerSortDirection] = useState<SortDirection>("asc");
  const [productSortField, setProductSortField] = useState<ProductSortField>("discount");
  const [productSortDirection, setProductSortDirection] = useState<SortDirection>("desc");
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 10;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for banner reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(newBanners);

      // Save new order to backend
      try {
        const response = await fetch("/api/admin/hero-banners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bannerIds: newBanners.map((b) => b.id),
          }),
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Banner order updated");
          // Refresh to get updated order numbers
          fetchBanners();
        } else {
          toast.error("Failed to save banner order");
          // Revert on failure
          fetchBanners();
        }
      } catch (error) {
        console.error("Failed to save banner order:", error);
        toast.error("Failed to save banner order");
        fetchBanners();
      }
    }
  };

  const handleBannerSort = (field: BannerSortField) => {
    if (bannerSortField === field) {
      setBannerSortDirection(bannerSortDirection === "asc" ? "desc" : "asc");
    } else {
      setBannerSortField(field);
      setBannerSortDirection("asc");
    }
  };

  const getBannerSortIcon = (field: BannerSortField) => {
    if (bannerSortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return bannerSortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const handleProductSort = (field: ProductSortField) => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === "asc" ? "desc" : "asc");
    } else {
      setProductSortField(field);
      setProductSortDirection("asc");
    }
  };

  const getProductSortIcon = (field: ProductSortField) => {
    if (productSortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return productSortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const fetchBanners = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/hero-banners");
      const data = await response.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    }
  }, []);

  const fetchDiscountedProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        hasDiscount: "true",
        ...(search && { search }),
      });
      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();
      if (data.success) {
        setDiscountedProducts(
          data.products.filter((p: any) => p.prices?.discount > 0)
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchBanners(), fetchDiscountedProducts()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchBanners, fetchDiscountedProducts]);

  // Client-side sorting for banners
  const sortedBanners = [...banners].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (bannerSortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "type":
        aValue = a.contentType.toLowerCase();
        bValue = b.contentType.toLowerCase();
        break;
      case "order":
        aValue = a.order;
        bValue = b.order;
        break;
      case "impressions":
        aValue = a.impressions || 0;
        bValue = b.impressions || 0;
        break;
      case "clicks":
        aValue = a.clicks || 0;
        bValue = b.clicks || 0;
        break;
      case "status":
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return bannerSortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return bannerSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Client-side sorting for discounted products
  const sortedDiscountedProducts = [...discountedProducts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (productSortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "category":
        aValue = a.category?.name?.toLowerCase() || "";
        bValue = b.category?.name?.toLowerCase() || "";
        break;
      case "discount":
        aValue = a.prices.discount || 0;
        bValue = b.prices.discount || 0;
        break;
      case "status":
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return productSortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return productSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination for discounted products
  const totalProductPages = Math.ceil(sortedDiscountedProducts.length / productsPerPage);
  const paginatedProducts = sortedDiscountedProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setProductPage(1);
  }, [search]);

  const handleDeleteBanner = async () => {
    if (!deleteId || deleteType !== "banner") return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/hero-banners/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error("Failed to delete banner:", error);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleBannerActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/hero-banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update banner");
        return;
      }
      if (isActive) {
        toast.success("Banner activated");
      }
      fetchBanners();
    } catch (error) {
      console.error("Failed to toggle banner:", error);
      toast.error("Failed to update banner");
    }
  };

  const handleRemoveProductDiscount = async (productId: string) => {
    try {
      // Find and deactivate any hero banners associated with this product
      const associatedBanners = banners.filter(
        (b) => b.contentType === "product" && b.isActive
      );
      // Check which banners have this productId (we need to fetch banner details to check)
      for (const banner of associatedBanners) {
        try {
          const bannerRes = await fetch(`/api/admin/hero-banners/${banner.id}`);
          const bannerData = await bannerRes.json();
          if (bannerData.success) {
            const bannerProductId = bannerData.banner.content?.productId?.id ||
              bannerData.banner.content?.productId;
            if (bannerProductId === productId) {
              // Deactivate this banner
              await fetch(`/api/admin/hero-banners/${banner.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }),
              });
              toast.info(`Hero banner "${banner.name}" has been deactivated`);
            }
          }
        } catch (e) {
          console.error("Failed to check/deactivate banner:", e);
        }
      }

      // Remove the product discount
      await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: { discount: 0, effectivePrice: 0 } }),
      });

      toast.success("Product discount removed");
      fetchDiscountedProducts();
      fetchBanners();
    } catch (error) {
      console.error("Failed to remove discount:", error);
      toast.error("Failed to remove discount");
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-sm text-muted-foreground">
            Manage hero banners and product discounts
          </p>
        </div>
      </div>

      <Tabs defaultValue="banners" className="space-y-6">
        <TabsList>
          <TabsTrigger value="banners">
            <ImageIcon className="h-4 w-4 mr-2" />
            Hero Banners
          </TabsTrigger>
          <TabsTrigger value="discounts">
            <Percent className="h-4 w-4 mr-2" />
            Product Discounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-end">
            <Link href={"/admin/offers/banners/new" as Route}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hero Banners</CardTitle>
              <CardDescription>
                Drag banners to reorder. Changes are saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-24 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No banners found</p>
                  <Link href={"/admin/offers/banners/new" as Route}>
                    <Button variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first banner
                    </Button>
                  </Link>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-24">Image</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 -ml-2 hover:bg-transparent"
                            onClick={() => handleBannerSort("name")}
                          >
                            Name
                            {getBannerSortIcon("name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 -ml-2 hover:bg-transparent"
                            onClick={() => handleBannerSort("type")}
                          >
                            Type
                            {getBannerSortIcon("type")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 -ml-2 hover:bg-transparent"
                            onClick={() => handleBannerSort("order")}
                          >
                            Order
                            {getBannerSortIcon("order")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 -ml-2 hover:bg-transparent"
                            onClick={() => handleBannerSort("impressions")}
                          >
                            Stats
                            {getBannerSortIcon("impressions")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 -ml-2 hover:bg-transparent"
                            onClick={() => handleBannerSort("status")}
                          >
                            Active
                            {getBannerSortIcon("status")}
                          </Button>
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <SortableContext
                      items={sortedBanners.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>
                        {sortedBanners.map((banner) => (
                          <SortableBannerRow
                            key={banner.id}
                            banner={banner}
                            onToggleActive={handleToggleBannerActive}
                            onDelete={(id) => {
                              setDeleteType("banner");
                              setDeleteId(id);
                            }}
                          />
                        ))}
                      </TableBody>
                    </SortableContext>
                  </Table>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>Products with Discounts</CardTitle>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
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
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : discountedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No products with discounts
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Edit products to add discounts
                  </p>
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
                          onClick={() => handleProductSort("name")}
                        >
                          Product
                          {getProductSortIcon("name")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 -ml-2 hover:bg-transparent"
                          onClick={() => handleProductSort("category")}
                        >
                          Category
                          {getProductSortIcon("category")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 -ml-2 hover:bg-transparent"
                          onClick={() => handleProductSort("discount")}
                        >
                          Discount
                          {getProductSortIcon("discount")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 -ml-2 hover:bg-transparent"
                          onClick={() => handleProductSort("status")}
                        >
                          Status
                          {getProductSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <p className="font-medium">{product.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category?.name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {product.prices.discount}% OFF
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={
                                    `/admin/products/${product.id}` as Route
                                  }
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Product
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleRemoveProductDiscount(product.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Discount
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {/* Pagination */}
              {!loading && discountedProducts.length > productsPerPage && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(productPage - 1) * productsPerPage + 1} to{" "}
                    {Math.min(productPage * productsPerPage, sortedDiscountedProducts.length)} of{" "}
                    {sortedDiscountedProducts.length} products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalProductPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, current, and pages around current
                          return (
                            page === 1 ||
                            page === totalProductPages ||
                            Math.abs(page - productPage) <= 1
                          );
                        })
                        .map((page, index, arr) => {
                          const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={productPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setProductPage(page)}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                      disabled={productPage === totalProductPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBanner}
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
