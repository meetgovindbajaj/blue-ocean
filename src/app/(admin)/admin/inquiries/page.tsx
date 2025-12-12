"use client";

import { useEffect, useState, useCallback } from "react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
  Mail,
  Phone,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  User,
} from "lucide-react";

type SortField = "name" | "email" | "status" | "product" | "createdAt";
type SortDirection = "asc" | "desc";
import { toast } from "sonner";

interface Note {
  adminId: string;
  note: string;
  timestamp: string;
}

interface UserComment {
  comment: string;
  timestamp: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: Note[];
  userComments?: UserComment[];
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  total: number;
  pending: number;
  "in-progress": number;
  "customer-feedback": number;
  resolved: number;
  closed: number;
}

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "customer-feedback", label: "Customer Feedback", color: "bg-purple-100 text-purple-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [responseMessage, setResponseMessage] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [responding, setResponding] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await fetch(`/api/admin/inquiries?${params}`);
      const data = await response.json();
      if (data.success) {
        setInquiries(data.inquiries);
        setTotalPages(data.pagination?.pages || 1);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Client-side sorting
  const sortedInquiries = [...inquiries].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "status":
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case "product":
        aValue = a.product?.name?.toLowerCase() || "";
        bValue = b.product?.name?.toLowerCase() || "";
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

  const handleView = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotes("");
    setViewDialogOpen(true);
  };

  const handleRespond = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseMessage("");
    setRespondDialogOpen(true);
  };

  const handleUpdateStatus = async (inquiryId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast.success("Status updated");
        fetchInquiries();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry || !adminNotes.trim()) {
      if (!adminNotes.trim()) {
        toast.error("Please enter a note");
      }
      return;
    }
    try {
      const response = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNotes.trim() }),
      });
      if (response.ok) {
        toast.success("Note added");
        setAdminNotes("");
        // Refresh the selected inquiry with new notes
        const data = await response.json();
        if (data.inquiry) {
          setSelectedInquiry((prev) =>
            prev ? { ...prev, notes: data.inquiry.notes } : null
          );
        }
        fetchInquiries();
      }
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseMessage.trim()) return;

    setResponding(true);
    try {
      const response = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendResponse: true,
          responseMessage,
          status: "resolved",
        }),
      });

      if (response.ok) {
        toast.success("Response sent successfully");
        setRespondDialogOpen(false);
        fetchInquiries();
      } else {
        throw new Error("Failed to send response");
      }
    } catch (error) {
      toast.error("Failed to send response");
    } finally {
      setResponding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/inquiries/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Inquiry deleted");
        fetchInquiries();
      }
    } catch (error) {
      toast.error("Failed to delete inquiry");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer inquiries and messages
          </p>
        </div>
      </div>

      {/* Status Cards */}
      {counts && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("pending")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("in-progress")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts["in-progress"]}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("customer-feedback")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts["customer-feedback"] || 0}</p>
                  <p className="text-xs text-muted-foreground">Feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("resolved")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inquiries found</p>
            </div>
          ) : (
            <>
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
                        Customer
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 hover:bg-transparent"
                        onClick={() => handleSort("product")}
                      >
                        Product
                        {getSortIcon("product")}
                      </Button>
                    </TableHead>
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
                        onClick={() => handleSort("createdAt")}
                      >
                        Date
                        {getSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inquiry.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {inquiry.email}
                          </p>
                          {inquiry.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {inquiry.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-xs">
                          {inquiry.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        {inquiry.product ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-3 w-3" />
                            {inquiry.product.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(inquiry)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRespond(inquiry)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Response
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(inquiry.id, "in-progress")}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(inquiry.id, "customer-feedback")}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Request Feedback
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(inquiry.id, "resolved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(inquiry.id, "closed")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Close
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(inquiry.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">Inquiry Details</DialogTitle>
                {selectedInquiry && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Received {formatDate(selectedInquiry.createdAt)}
                  </p>
                )}
              </div>
              {selectedInquiry && (
                <div className="flex-shrink-0">
                  {getStatusBadge(selectedInquiry.status)}
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedInquiry && (
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedInquiry.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedInquiry.email}</p>
                  </div>
                </div>
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {selectedInquiry.phone}
                  </div>
                )}
                {selectedInquiry.product && (
                  <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-border/50">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{selectedInquiry.product.name}</span>
                  </div>
                )}
              </div>

              {/* Original Message */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Original Message
                </Label>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
                  <p className="text-sm whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* Timeline - Mixed messages */}
              {(() => {
                // Combine and sort all messages chronologically
                const timelineItems: Array<{
                  type: 'user' | 'admin' | 'email';
                  content: string;
                  timestamp: string;
                }> = [];

                selectedInquiry.userComments?.forEach((comment) => {
                  timelineItems.push({
                    type: 'user',
                    content: comment.comment,
                    timestamp: comment.timestamp,
                  });
                });

                selectedInquiry.notes?.forEach((note) => {
                  timelineItems.push({
                    type: note.note.startsWith("[Email Response Sent]") ? 'email' : 'admin',
                    content: note.note.startsWith("[Email Response Sent]")
                      ? note.note.replace("[Email Response Sent]\n", "")
                      : note.note,
                    timestamp: note.timestamp,
                  });
                });

                // Sort by timestamp (oldest first for natural conversation flow)
                timelineItems.sort((a, b) =>
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                if (timelineItems.length === 0) return null;

                return (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                      Conversation Timeline
                    </Label>
                    <div className="space-y-3">
                      {timelineItems.map((item, index) => {
                        const isUser = item.type === 'user';
                        const isEmail = item.type === 'email';

                        return (
                          <div
                            key={index}
                            className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl p-3 ${
                                isUser
                                  ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-tl-sm'
                                  : isEmail
                                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-tr-sm'
                                  : 'bg-muted rounded-tr-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {isUser ? (
                                  <>
                                    <User className="h-3 w-3 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-600">Customer</span>
                                  </>
                                ) : isEmail ? (
                                  <>
                                    <Mail className="h-3 w-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-600">Email Sent</span>
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Admin Note</span>
                                  </>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Add New Note */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Add Note</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this inquiry..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSaveNotes} disabled={!adminNotes.trim()}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl">Send Response</DialogTitle>
            <DialogDescription>
              Send an email response to {selectedInquiry?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedInquiry?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInquiry?.email}</p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Original Message
              </Label>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
                <p className="text-sm line-clamp-4">{selectedInquiry?.message}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="response" className="text-sm font-medium mb-2 block">
                Your Response
              </Label>
              <Textarea
                id="response"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response to the customer..."
                className="min-h-[150px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendResponse} disabled={responding || !responseMessage.trim()}>
              {responding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
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
            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inquiry? This action cannot be
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
