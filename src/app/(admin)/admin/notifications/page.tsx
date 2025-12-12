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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Users,
  Package,
  Search,
  Loader2,
  Mail,
  Megaphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

type EmailType = "newsletter" | "promotion";

export default function NotificationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailType, setEmailType] = useState<EmailType>("newsletter");

  const [subject, setSubject] = useState("Check out our latest products!");
  const [message, setMessage] = useState(
    "We are excited to share some amazing new products with you. Take a look at what we have in store!"
  );
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<{
    status: "in_progress" | "completed";
    total: number;
    sent: number;
    failed: number;
    errors: string[];
    duration?: number;
  } | null>(null);

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

  // Fetch subscribers based on email type
  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/notifications?emailType=${emailType}`);
      const data = await response.json();
      if (data.success) {
        setSubscriberCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    }
  }, [emailType]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchSubscribers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProducts, fetchSubscribers]);

  // Poll for send status when we have a tracking ID
  useEffect(() => {
    if (!trackingId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/admin/notifications?trackingId=${trackingId}`);
        const data = await response.json();
        if (data.success) {
          setSendStatus({
            status: data.status,
            total: data.total,
            sent: data.sent,
            failed: data.failed,
            errors: data.errors || [],
            duration: data.duration,
          });

          // Stop polling when completed
          if (data.status === "completed") {
            setTrackingId(null);
            setSending(false);
            if (data.failed === 0) {
              toast.success(`All ${data.sent} emails sent successfully!`);
            } else if (data.sent > 0) {
              toast.warning(`${data.sent} sent, ${data.failed} failed`);
            } else {
              toast.error(`All ${data.failed} emails failed to send`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch send status:", error);
      }
    };

    // Initial fetch
    pollStatus();

    // Poll every 2 seconds while in progress
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [trackingId]);

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
    setSendStatus(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts,
          subject,
          message,
          emailType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.trackingId) {
          setTrackingId(data.trackingId);
          setSendStatus({
            status: "in_progress",
            total: data.queued,
            sent: 0,
            failed: 0,
            errors: [],
          });
          toast.info(`Sending ${data.queued} emails...`);
        } else {
          toast.success(`Emails queued for ${data.queued} subscriber(s)`);
          setSending(false);
        }
      } else {
        toast.error(data.error || "Failed to send emails");
        setSending(false);
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
      toast.error("Failed to send emails");
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
        {/* Email Type Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Email Type
            </CardTitle>
            {emailType === "newsletter" ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="newsletter" className="gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Newsletter
                </TabsTrigger>
                <TabsTrigger value="promotion" className="gap-2">
                  <Megaphone className="h-3.5 w-3.5" />
                  Promotion
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-2">
              {emailType === "newsletter"
                ? "Send to newsletter subscribers"
                : "Send to promotion subscribers"}
            </p>
          </CardContent>
        </Card>

        {/* Subscriber Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {emailType === "newsletter" ? "Newsletter" : "Promotion"} Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberCount}</div>
            <p className="text-xs text-muted-foreground">
              customers subscribed to {emailType === "newsletter" ? "newsletters" : "promotions"}
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

      {/* Send Status Card - shown when sending or after completion */}
      {sendStatus && (
        <Card className={sendStatus.status === "completed" ? (sendStatus.failed === 0 ? "border-green-500" : sendStatus.sent === 0 ? "border-red-500" : "border-yellow-500") : "border-blue-500"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {sendStatus.status === "in_progress" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  Sending Emails...
                </>
              ) : sendStatus.failed === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  All Emails Sent Successfully
                </>
              ) : sendStatus.sent === 0 ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  All Emails Failed
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Emails Sent with Errors
                </>
              )}
            </CardTitle>
            {sendStatus.status === "completed" && (
              <button
                onClick={() => setSendStatus(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{sendStatus.sent + sendStatus.failed} / {sendStatus.total}</span>
              </div>
              <Progress
                value={sendStatus.total > 0 ? ((sendStatus.sent + sendStatus.failed) / sendStatus.total) * 100 : 0}
                className="h-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{sendStatus.sent}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{sendStatus.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sendStatus.total - sendStatus.sent - sendStatus.failed}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            {sendStatus.duration && sendStatus.status === "completed" && (
              <p className="text-xs text-muted-foreground text-center">
                Completed in {(sendStatus.duration / 1000).toFixed(1)} seconds
              </p>
            )}
            {sendStatus.errors.length > 0 && sendStatus.status === "completed" && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-600 mb-1">
                  Failed recipients ({sendStatus.errors.length}):
                </p>
                <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground bg-muted p-2 rounded">
                  {sendStatus.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="truncate">{err}</p>
                  ))}
                  {sendStatus.errors.length > 5 && (
                    <p className="text-muted-foreground">...and {sendStatus.errors.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              Send {emailType === "newsletter" ? "Newsletter" : "Promotion"} to {subscriberCount} Subscribers
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send {emailType === "newsletter" ? "Newsletter" : "Promotion"} Email
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send a{" "}
              <strong>{emailType === "newsletter" ? "newsletter" : "promotion"}</strong> email to{" "}
              <strong>{subscriberCount}</strong> {emailType} subscribers about{" "}
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
              Send {emailType === "newsletter" ? "Newsletter" : "Promotion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
