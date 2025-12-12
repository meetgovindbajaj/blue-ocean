"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import {
  Send,
  Users,
  Package,
  Search,
  Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  prices: {
    retail: number;
  };
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    isThumbnail?: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [subject, setSubject] = useState("Check out our latest products!");
  const [message, setMessage] = useState(
    "We are excited to share some amazing new products with you. Take a look at what we have in store!"
  );

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        isActive: "true",
        ...(search && { search }),
      });
      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, [search]);

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      const data = await response.json();
      if (data.success) {
        setSubscriberCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchSubscribers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProducts, fetchSubscribers]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handleSendEmails = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setSending(true);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Emails queued for ${data.queued} subscriber(s)`);
      } else {
        toast.error(data.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
      toast.error("Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  const getThumbnail = (product: Product) => {
    const thumbnail = product.images?.find((img) => img.isThumbnail);
    return (
      thumbnail?.thumbnailUrl || thumbnail?.url || product.images?.[0]?.url
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Send email notifications about products to subscribed customers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Subscriber Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Email Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberCount}</div>
            <p className="text-xs text-muted-foreground">
              customers with email notifications enabled
            </p>
          </CardContent>
        </Card>

        {/* Selected Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Selected Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              products to include in email
            </p>
          </CardContent>
        </Card>

        </div>

      {/* Email Compose Section */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>
            Customize the email subject and message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Products</CardTitle>
              <CardDescription>
                Choose products to include in the notification email
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedProducts.length === products.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className={
                        selectedProducts.includes(product.id) ? "bg-muted/50" : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {getThumbnail(product) ? (
                          <Image
                            src={getThumbnail(product)!}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {formatPrice(product.prices?.retail || 0)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSendEmails}
          disabled={
            sending || selectedProducts.length === 0 || subscriberCount === 0
          }
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to {subscriberCount} Subscribers
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Notification Emails</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send an email to{" "}
              <strong>{subscriberCount}</strong> subscribers about{" "}
              <strong>{selectedProducts.length}</strong> product(s).
              <br />
              <br />
              Subject: <strong>{subject}</strong>
              <br />
              <br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend}>
              Send Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
