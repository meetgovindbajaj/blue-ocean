"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  MousePointer,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  UserCheck,
  Tag,
  PieChart,
  Activity,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    totalBannerClicks: number;
    totalTagClicks: number;
    totalProducts: number;
    totalUsers: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    views: number;
    uniqueVisitors: number;
    percentage: number;
  }>;
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
    views: number;
  }>;
  bannerStats: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  tagStats: Array<{
    id: string;
    name: string;
    slug: string;
    clicks: number;
  }>;
  dailyTrends: Array<{
    date: string;
    views: number;
    clicks: number;
  }>;
  entityBreakdown: Array<{
    name: string;
    value: number;
  }>;
}

const ENTITY_COLORS: Record<string, string> = {
  product: "bg-blue-500",
  category: "bg-green-500",
  banner: "bg-purple-500",
  tag: "bg-orange-500",
  page: "bg-cyan-500",
};

const ENTITY_LABELS: Record<string, string> = {
  product: "Products",
  category: "Categories",
  banner: "Banners",
  tag: "Tags",
  page: "Pages",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics?period=${period}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  const overviewCards = [
    {
      title: "Total Views",
      value: data?.overview.totalViews || 0,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Clicks",
      value: data?.overview.totalClicks || 0,
      icon: MousePointer,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Unique Visitors",
      value: data?.overview.uniqueVisitors || 0,
      icon: UserCheck,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "Tag Clicks",
      value: data?.overview.totalTagClicks || 0,
      icon: Tag,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Products",
      value: data?.overview.totalProducts || 0,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Users",
      value: data?.overview.totalUsers || 0,
      icon: Users,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  // Calculate max values for charts
  const maxDailyViews = Math.max(...(data?.dailyTrends?.map((d) => d.views) || [1]), 1);
  const maxTagClicks = Math.max(...(data?.tagStats?.map((t) => t.clicks) || [1]), 1);
  const totalEntityEvents = data?.entityBreakdown?.reduce((sum, e) => sum + e.value, 0) || 1;

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-start justify-between md:flex-row flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track performance and engagement metrics
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Daily Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.dailyTrends && data.dailyTrends.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="flex items-end gap-1" style={{ height: "160px" }}>
                  {data.dailyTrends.slice(-14).map((day, index) => {
                    const viewHeight = Math.max((day.views / maxDailyViews) * 100, 2);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 min-h-[4px]"
                          style={{ height: `${viewHeight}%` }}
                          title={`${day.date}: ${day.views} views`}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Date labels */}
                <div className="flex gap-1">
                  {data.dailyTrends.slice(-14).map((day, index) => (
                    <div key={`label-${day.date}`} className="flex-1 text-center">
                      {index % 2 === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {day.date.slice(5)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Views</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trend data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Entity Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Activity by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.entityBreakdown && data.entityBreakdown.length > 0 ? (
              <div className="space-y-4">
                {/* Simple horizontal bars */}
                <div className="space-y-3">
                  {data.entityBreakdown
                    .filter((e) => e.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .map((entity) => {
                      const percentage = (entity.value / totalEntityEvents) * 100;
                      return (
                        <div key={entity.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {ENTITY_LABELS[entity.name] || entity.name}
                            </span>
                            <span className="text-muted-foreground">
                              {entity.value.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${ENTITY_COLORS[entity.name] || "bg-gray-500"} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Products by Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((product, index) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {product.views.toLocaleString()} views
                      </span>
                    </div>
                    <Progress value={product.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tag Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.tagStats && data.tagStats.length > 0 ? (
                data.tagStats.slice(0, 5).map((tag, index) => {
                  const percentage = (tag.clicks / maxTagClicks) * 100;
                  return (
                    <div key={tag.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium truncate max-w-[200px]">
                            {tag.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {tag.clicks.toLocaleString()} clicks
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2 [&>div]:bg-orange-500"
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tag data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Categories Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topCategories && data.topCategories.length > 0 ? (
                data.topCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.productCount} products
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {category.views.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Banner Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Banner Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {data?.bannerStats && data.bannerStats.length > 0 ? (
                <div className="space-y-3">
                  {data.bannerStats.map((banner) => (
                    <div
                      key={banner.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <p className="font-medium truncate text-sm">{banner.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-base font-bold">
                            {banner.impressions.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Impressions
                          </p>
                        </div>
                        <div>
                          <p className="text-base font-bold">
                            {banner.clicks.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Clicks
                          </p>
                        </div>
                        <div>
                          <p className="text-base font-bold">
                            {banner.ctr.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No banner data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
