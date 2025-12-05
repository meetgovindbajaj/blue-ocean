"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Shield,
  Eye,
  Phone,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Loader2,
  Key,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Mail,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    newsletter?: boolean;
    promotions?: boolean;
    currency?: string;
    language?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

interface ActiveToken {
  token: string;
  type: string;
  expiresAt: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  authType?: string;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  loginAttempts?: number;
  lockUntil?: string;
  permissions?: string[];
  profile?: Profile;
  activeTokens?: ActiveToken[];
  createdAt: string;
  updatedAt?: string;
}

interface EditFormData {
  name: string;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  phone: string;
  dateOfBirth: string;
  gender: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const ROLES = ["customer", "admin", "super_admin"];
const STATUSES = ["pending", "active", "suspended", "inactive"];
const GENDERS = ["male", "female", "other"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View/Edit user states
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: "",
    email: "",
    role: "customer",
    status: "pending",
    isVerified: false,
    twoFactorEnabled: false,
    phone: "",
    dateOfBirth: "",
    gender: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserDetails = async (userId: string): Promise<User | null> => {
    setLoadingUser(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        return data.user;
      }
      toast.error("Failed to fetch user details");
      return null;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("Failed to fetch user details");
      return null;
    } finally {
      setLoadingUser(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    const user = await fetchUserDetails(userId);
    if (user) {
      setViewUser(user);
    }
  };

  const handleEditUser = async (userId: string) => {
    const user = await fetchUserDetails(userId);
    if (user) {
      setEditUser(user);
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "customer",
        status: user.status || "pending",
        isVerified: user.isVerified || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        phone: user.profile?.phone || "",
        dateOfBirth: user.profile?.dateOfBirth
          ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.profile?.gender || "",
        street: user.profile?.address?.street || "",
        city: user.profile?.address?.city || "",
        state: user.profile?.address?.state || "",
        postalCode: user.profile?.address?.postalCode || "",
        country: user.profile?.address?.country || "India",
      });
    }
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Update user
      const userResponse = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          status: editForm.status,
          isVerified: editForm.isVerified,
          twoFactorEnabled: editForm.twoFactorEnabled,
        }),
      });

      if (!userResponse.ok) {
        const data = await userResponse.json();
        throw new Error(data.error || "Failed to update user");
      }

      // Update profile if user has one
      if (editUser.profile?.id) {
        const profileResponse = await fetch(
          `/api/admin/users/${editUser.id}/profile`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: editForm.phone,
              dateOfBirth: editForm.dateOfBirth || undefined,
              gender: editForm.gender || undefined,
              address: {
                street: editForm.street,
                city: editForm.city,
                state: editForm.state,
                postalCode: editForm.postalCode,
                country: editForm.country,
              },
            }),
          }
        );

        if (!profileResponse.ok) {
          console.warn("Profile update may have failed");
        }
      }

      toast.success("User updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast.error(error.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleQuickUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        toast.success("User updated");
        fetchUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleUnlockAccount = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginAttempts: 0, lockUntil: null }),
      });
      if (response.ok) {
        toast.success("Account unlocked");
        fetchUsers();
      } else {
        toast.error("Failed to unlock account");
      }
    } catch (error) {
      console.error("Failed to unlock account:", error);
      toast.error("Failed to unlock account");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "suspended":
        return "destructive";
      case "inactive":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getTokenTypeLabel = (type: string) => {
    switch (type) {
      case "email_verification":
        return "Email Verification";
      case "reset_password":
        return "Password Reset";
      case "activation":
        return "Account Activation";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getTokenTypeIcon = (type: string) => {
    switch (type) {
      case "email_verification":
        return Mail;
      case "reset_password":
        return KeyRound;
      default:
        return Key;
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.lastLogin
                            ? formatDate(user.lastLogin)
                            : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {user.role !== "super_admin" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user.id)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickUpdate(user.id, {
                                      isVerified: !user.isVerified,
                                    })
                                  }
                                >
                                  {user.isVerified ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Unverify Email
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verify Email
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickUpdate(user.id, {
                                      status: "active",
                                    })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickUpdate(user.id, {
                                      status: "suspended",
                                    })
                                  }
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickUpdate(user.id, {
                                      role: "customer",
                                    })
                                  }
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Make Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickUpdate(user.id, {
                                      role: "admin",
                                    })
                                  }
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete user information
            </DialogDescription>
          </DialogHeader>
          {loadingUser ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            viewUser && (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Avatar className="h-16 w-16">
                      {viewUser.profile?.avatar ? (
                        <AvatarImage src={viewUser.profile.avatar} />
                      ) : null}
                      <AvatarFallback className="text-lg">
                        {getInitials(viewUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{viewUser.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {viewUser.email}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getRoleBadgeVariant(viewUser.role)}>
                          {viewUser.role.replace("_", " ")}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(viewUser.status)}>
                          {viewUser.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Auth Type</p>
                      <p className="font-medium capitalize">
                        {viewUser.authType || "Manual"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Email Verified
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        {viewUser.isVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />{" "}
                            Yes
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" /> No
                          </>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {formatDate(viewUser.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="font-medium">
                        {formatDate(viewUser.updatedAt)}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="font-medium">
                        {viewUser.profile?.phone || "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date of Birth
                      </p>
                      <p className="font-medium">
                        {viewUser.profile?.dateOfBirth
                          ? new Date(
                              viewUser.profile.dateOfBirth
                            ).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {viewUser.profile?.gender || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </p>
                    {viewUser.profile?.address ? (
                      <p className="font-medium">
                        {[
                          viewUser.profile.address.street,
                          viewUser.profile.address.city,
                          viewUser.profile.address.state,
                          viewUser.profile.address.postalCode,
                          viewUser.profile.address.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not set"}
                      </p>
                    ) : (
                      <p className="font-medium">Not set</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {viewUser.profile?.preferences?.newsletter && (
                        <Badge variant="outline">Newsletter</Badge>
                      )}
                      {viewUser.profile?.preferences?.promotions && (
                        <Badge variant="outline">Promotions</Badge>
                      )}
                      <Badge variant="outline">
                        Currency:{" "}
                        {viewUser.profile?.preferences?.currency || "INR"}
                      </Badge>
                      <Badge variant="outline">
                        Language:{" "}
                        {viewUser.profile?.preferences?.language || "en"}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last Login
                      </p>
                      <p className="font-medium">
                        {formatDate(viewUser.lastLogin)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Key className="h-3 w-3" /> Last Password Change
                      </p>
                      <p className="font-medium">
                        {formatDate(viewUser.lastPasswordChange)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Two-Factor Auth
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        {viewUser.twoFactorEnabled ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />{" "}
                            Enabled
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />{" "}
                            Disabled
                          </>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Login Attempts
                      </p>
                      <p className="font-medium">
                        {viewUser.loginAttempts || 0}
                      </p>
                    </div>
                  </div>

                  {viewUser.lockUntil &&
                    new Date(viewUser.lockUntil) > new Date() && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Account is locked until{" "}
                          {formatDate(viewUser.lockUntil)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            handleUnlockAccount(viewUser.id);
                            setViewUser(null);
                          }}
                        >
                          Unlock Account
                        </Button>
                      </div>
                    )}

                  {viewUser.permissions && viewUser.permissions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Permissions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewUser.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Tokens Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Active Tokens
                      {viewUser.activeTokens &&
                        viewUser.activeTokens.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {viewUser.activeTokens.length}
                          </Badge>
                        )}
                    </p>
                    {viewUser.activeTokens &&
                    viewUser.activeTokens.length > 0 ? (
                      <div className="space-y-2">
                        {viewUser.activeTokens.map((token, index) => {
                          const TokenIcon = getTokenTypeIcon(token.type);
                          return (
                            <div
                              key={index}
                              className="p-3 bg-muted rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TokenIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">
                                    {getTokenTypeLabel(token.type)}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Expires: {formatDate(token.expiresAt)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-background px-2 py-1 rounded border font-mono truncate">
                                  {token.token}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      token.token,
                                      getTokenTypeLabel(token.type) + " Token"
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              {token.type === "email_verification" && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Verification URL:
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      const url = `${window.location.origin}/auth/verify-email?token=${token.token}`;
                                      copyToClipboard(url, "Verification URL");
                                    }}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy Full URL
                                  </Button>
                                </div>
                              )}
                              {token.type === "reset_password" && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Reset URL:
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      const url = `${window.location.origin}/auth/reset-password?token=${token.token}`;
                                      copyToClipboard(
                                        url,
                                        "Password Reset URL"
                                      );
                                    }}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy Full URL
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        No active tokens for this user
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>
              Close
            </Button>
            {viewUser?.role !== "super_admin" && (
              <Button
                onClick={() => {
                  if (viewUser) {
                    handleEditUser(viewUser.id);
                    setViewUser(null);
                  }
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information
            </DialogDescription>
          </DialogHeader>
          {loadingUser ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            editUser && (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="address">Address</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, role: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.replace("_", " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, status: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Verified</Label>
                        <p className="text-sm text-muted-foreground">
                          Mark email as verified
                        </p>
                      </div>
                      <Switch
                        checked={editForm.isVerified}
                        onCheckedChange={(v) =>
                          setEditForm({ ...editForm, isVerified: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable 2FA
                        </p>
                      </div>
                      <Switch
                        checked={editForm.twoFactorEnabled}
                        onCheckedChange={(v) =>
                          setEditForm({ ...editForm, twoFactorEnabled: v })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editForm.gender || "none"}
                      onValueChange={(v) =>
                        setEditForm({
                          ...editForm,
                          gender: v === "none" ? "" : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {GENDERS.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={editForm.street}
                      onChange={(e) =>
                        setEditForm({ ...editForm, street: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm({ ...editForm, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={editForm.state}
                        onChange={(e) =>
                          setEditForm({ ...editForm, state: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={editForm.postalCode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            postalCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editForm.country}
                        onChange={(e) =>
                          setEditForm({ ...editForm, country: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
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
