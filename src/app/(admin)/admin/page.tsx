"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  FolderTree,
  Users,
  Image as ImageIcon,
  TrendingUp,
  Eye,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Calendar,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { Route } from "next";

interface DashboardStats {
  products: { total: number; active: number };
  categories: { total: number; active: number };
  users: { total: number; active: number };
  banners: { total: number; active: number };
  inquiries: { total: number; pending: number };
  analytics: {
    viewsToday: number;
    viewsThisWeek: number;
  };
  recentProducts: Array<{
    id: string;
    name: string;
    price: number;
    views: number;
    score: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    views: number;
    score: number;
  }>;
  topViewedThisWeek: Array<{
    id: string;
    name: string;
    views: number;
    uniqueVisitors: number;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats?.products.total ?? 0,
      subValue: `${stats?.products.active ?? 0} active`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/admin/products",
    },
    {
      title: "Categories",
      value: stats?.categories.total ?? 0,
      subValue: `${stats?.categories.active ?? 0} active`,
      icon: FolderTree,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/admin/categories",
    },
    {
      title: "Users",
      value: stats?.users.total ?? 0,
      subValue: `${stats?.users.active ?? 0} active`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/admin/users",
    },
    {
      title: "Hero Banners",
      value: stats?.banners.total ?? 0,
      subValue: `${stats?.banners.active ?? 0} active`,
      icon: ImageIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/admin/offers",
    },
    {
      title: "Inquiries",
      value: stats?.inquiries?.total ?? 0,
      subValue: `${stats?.inquiries?.pending ?? 0} pending`,
      icon: MessageSquare,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      href: "/admin/inquiries",
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-start justify-between md:flex-row flex-col">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to Blue Ocean Admin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href as Route}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-100">
              <Eye className="h-4 w-4 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.analytics?.viewsToday ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Product page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views This Week
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-100">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.analytics?.viewsThisWeek ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100">
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.users?.active ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Verified accounts</p>
          </CardContent>
        </Card>

        <Link href="/admin/inquiries">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Inquiries
              </CardTitle>
              <div className="p-2 rounded-lg bg-rose-100">
                <MessageSquare className="h-4 w-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.inquiries?.pending ?? 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Needs attention <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Products Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Recent Products
            </CardTitle>
            <Link
              href="/admin/products"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentProducts?.length ? (
                stats.recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <Eye className="h-3 w-3" />
                      {product.views}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent products
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products (All Time) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Top Products
            </CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              All Time
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topProducts?.length ? (
                stats.topProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <Eye className="h-3 w-3" />
                      {product.views}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trending This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Trending This Week
            </CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Last 7 days
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topViewedThisWeek?.length ? (
                stats.topViewedThisWeek.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.uniqueVisitors} unique visitors
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <Eye className="h-3 w-3" />
                      {product.views}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data this week
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Add Product</p>
                <p className="text-xs text-muted-foreground">
                  Create new listing
                </p>
              </div>
            </Link>

            <Link
              href="/admin/categories/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-100">
                <FolderTree className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Add Category</p>
                <p className="text-xs text-muted-foreground">
                  Organize products
                </p>
              </div>
            </Link>

            <Link
              href={"/admin/offers/banners/new" as Route}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-orange-100">
                <ImageIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Add Banner</p>
                <p className="text-xs text-muted-foreground">Promote content</p>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-purple-100">
                <ExternalLink className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Site Settings</p>
                <p className="text-xs text-muted-foreground">Configure site</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
