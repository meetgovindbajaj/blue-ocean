"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
    productViews: number;
    categoryViews: number;
    bannerImpressions: number;
    bannerClicks: number;
    tagClicks: number;
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

// Chart configurations - now with separate colors for each event type
const dailyTrendsConfig = {
  productViews: {
    label: "Products",
    color: "hsl(217, 91%, 60%)", // Blue
  },
  categoryViews: {
    label: "Categories",
    color: "hsl(217, 91%, 75%)", // Light Blue
  },
  bannerImpressions: {
    label: "Impressions",
    color: "hsl(262, 83%, 58%)", // Purple
  },
  bannerClicks: {
    label: "Banner Clicks",
    color: "hsl(262, 83%, 75%)", // Light Purple
  },
  tagClicks: {
    label: "Tags",
    color: "hsl(142, 71%, 45%)", // Green
  },
} satisfies ChartConfig;

const entityPieConfig = {
  product: {
    label: "Products",
    color: "hsl(217, 91%, 60%)", // blue
  },
  category: {
    label: "Categories",
    color: "hsl(142, 71%, 45%)", // green
  },
  banner: {
    label: "Banners",
    color: "hsl(262, 83%, 58%)", // purple
  },
  tag: {
    label: "Tags",
    color: "hsl(25, 95%, 53%)", // orange
  },
  page: {
    label: "Pages",
    color: "hsl(189, 94%, 43%)", // cyan
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  "hsl(217, 91%, 60%)", // blue
  "hsl(142, 71%, 45%)", // green
  "hsl(262, 83%, 58%)", // purple
  "hsl(25, 95%, 53%)", // orange
  "hsl(189, 94%, 43%)", // cyan
];

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
    <div className="flex-1 p-6 space-y-6 overflow-x-hidden">
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
        {/* Weekly Trends Chart */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Site Activity
            </CardTitle>
            <CardDescription className="text-xs space-y-0.5">
              <span className="block">
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
                Products &amp;{" "}
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 ml-1" style={{ backgroundColor: "hsl(217, 91%, 75%)" }} />
                Categories (views)
              </span>
              <span className="block">
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: "hsl(262, 83%, 58%)" }} />
                Impressions &amp;{" "}
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 ml-1" style={{ backgroundColor: "hsl(262, 83%, 75%)" }} />
                Banner Clicks
              </span>
              <span className="block">
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
                Tag Clicks
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 overflow-hidden">
            {data?.dailyTrends && data.dailyTrends.length > 0 ? (
              <ChartContainer
                config={dailyTrendsConfig}
                className="aspect-auto h-[340px] w-full"
              >
                <AreaChart data={data.dailyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Product Views - Dark Blue */}
                    <linearGradient id="fillProductViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-productViews)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-productViews)" stopOpacity={0.1} />
                    </linearGradient>
                    {/* Category Views - Light Blue */}
                    <linearGradient id="fillCategoryViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-categoryViews)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-categoryViews)" stopOpacity={0.1} />
                    </linearGradient>
                    {/* Banner Impressions - Dark Purple */}
                    <linearGradient id="fillBannerImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-bannerImpressions)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-bannerImpressions)" stopOpacity={0.1} />
                    </linearGradient>
                    {/* Banner Clicks - Light Purple */}
                    <linearGradient id="fillBannerClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-bannerClicks)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-bannerClicks)" stopOpacity={0.1} />
                    </linearGradient>
                    {/* Tag Clicks - Green */}
                    <linearGradient id="fillTagClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-tagClicks)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-tagClicks)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={40}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        className="w-[220px] p-3"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-3 py-0.5 w-full">
                            <span className="text-muted-foreground text-xs truncate flex-shrink min-w-0">
                              {dailyTrendsConfig[name as keyof typeof dailyTrendsConfig]?.label || name}
                            </span>
                            <span className="font-mono font-semibold tabular-nums text-xs flex-shrink-0">
                              {(value as number).toLocaleString()}
                            </span>
                          </div>
                        )}
                        indicator="dot"
                      />
                    }
                  />
                  {/* Page Views - stacked together (blue hues) */}
                  <Area
                    dataKey="productViews"
                    type="natural"
                    fill="url(#fillProductViews)"
                    stroke="var(--color-productViews)"
                    strokeWidth={2}
                    stackId="views"
                  />
                  <Area
                    dataKey="categoryViews"
                    type="natural"
                    fill="url(#fillCategoryViews)"
                    stroke="var(--color-categoryViews)"
                    strokeWidth={2}
                    stackId="views"
                  />
                  {/* Banner stats - stacked together (purple hues) */}
                  <Area
                    dataKey="bannerImpressions"
                    type="natural"
                    fill="url(#fillBannerImpressions)"
                    stroke="var(--color-bannerImpressions)"
                    strokeWidth={2}
                    stackId="banners"
                  />
                  <Area
                    dataKey="bannerClicks"
                    type="natural"
                    fill="url(#fillBannerClicks)"
                    stroke="var(--color-bannerClicks)"
                    strokeWidth={2}
                    stackId="banners"
                  />
                  {/* Tag clicks (green) */}
                  <Area
                    dataKey="tagClicks"
                    type="natural"
                    fill="url(#fillTagClicks)"
                    stroke="var(--color-tagClicks)"
                    strokeWidth={2}
                    stackId="tags"
                  />
                  <ChartLegend content={<ChartLegendContent className="flex-wrap justify-center gap-x-4 gap-y-1" />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trend data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Entity Breakdown Pie Chart */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Activity by Type
            </CardTitle>
            <CardDescription>Distribution of events by entity type</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {data?.entityBreakdown && data.entityBreakdown.length > 0 ? (
              (() => {
                // Filter and sort data once, use same order for both chart and legend
                const sortedData = data.entityBreakdown
                  .filter((e) => e.value > 0)
                  .sort((a, b) => b.value - a.value);

                return (
                  <div className="flex flex-col items-center">
                    <ChartContainer
                      config={entityPieConfig}
                      className="aspect-square h-[200px] w-full max-w-[200px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name) => (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {ENTITY_LABELS[name as string] || name}:
                                  </span>
                                  <span>{(value as number).toLocaleString()}</span>
                                </div>
                              )}
                            />
                          }
                        />
                        <Pie
                          data={sortedData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {sortedData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ChartContainer>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {sortedData.map((entity, index) => {
                        const percentage = (entity.value / totalEntityEvents) * 100;
                        return (
                          <div
                            key={entity.name}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className="h-3 w-3 rounded-sm"
                              style={{
                                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span>
                              {ENTITY_LABELS[entity.name] || entity.name} (
                              {percentage.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products List */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Products by Page Views
          </CardTitle>
          <CardDescription>
            Most viewed product pages during the selected period
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
              {data.topProducts.map((product, index) => {
                const maxViews = data.topProducts[0]?.views || 1;
                const percentage = (product.views / maxViews) * 100;
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={product.name}>
                        {product.name}
                      </p>
                      <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm tabular-nums">
                        {product.views.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.uniqueVisitors} visitors
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No product view data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Categories and Tags Row */}
      <div className="grid gap-6 md:grid-cols-2 overflow-hidden">
        {/* Top Categories List */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 shrink-0" />
              <span className="truncate">Category Page Views</span>
            </CardTitle>
            <CardDescription className="truncate">
              Views on category listing pages
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 overflow-hidden">
            {data?.topCategories && data.topCategories.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2 space-y-2">
                {data.topCategories.map((category, index) => {
                  const maxViews = data.topCategories[0]?.views || 1;
                  const percentage = maxViews > 0 ? (category.views / maxViews) * 100 : 0;
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-semibold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={category.name}>
                          {category.name}
                        </p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm tabular-nums">
                          {category.views.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.productCount} products
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tag Clicks List */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 shrink-0" />
              <span className="truncate">Tag Click Performance</span>
            </CardTitle>
            <CardDescription className="truncate">
              Number of clicks on product tags
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 overflow-hidden">
            {data?.tagStats && data.tagStats.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2 space-y-2">
                {data.tagStats.map((tag, index) => {
                  const maxClicks = data.tagStats[0]?.clicks || 1;
                  const percentage = maxClicks > 0 ? (tag.clicks / maxClicks) * 100 : 0;
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-semibold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={tag.name}>
                          {tag.name}
                        </p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm tabular-nums">
                          {tag.clicks.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tag click data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banner Performance */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hero Banner Performance
          </CardTitle>
          <CardDescription>
            Banner impressions (times shown), clicks, and click-through rate (CTR)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {data?.bannerStats && data.bannerStats.length > 0 ? (
            <div className="space-y-4">
              {/* Banner Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.bannerStats.map((banner) => {
                  const maxImpressions = Math.max(
                    ...data.bannerStats.map((b) => b.impressions),
                    1
                  );
                  const impressionPercentage =
                    (banner.impressions / maxImpressions) * 100;

                  return (
                    <div
                      key={banner.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">
                          {banner.name}
                        </h4>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            banner.ctr >= 2
                              ? "bg-green-100 text-green-700"
                              : banner.ctr >= 1
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {banner.ctr.toFixed(1)}% CTR
                        </span>
                      </div>

                      {/* Impressions Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Impressions</span>
                          <span className="font-medium text-foreground">
                            {banner.impressions.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${impressionPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Clicks Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Clicks</span>
                          <span className="font-medium text-foreground">
                            {banner.clicks.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${
                                banner.impressions > 0
                                  ? (banner.clicks / banner.impressions) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="flex items-center justify-center gap-8 pt-4 border-t text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.bannerStats
                      .reduce((sum, b) => sum + b.impressions, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Total Impressions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.bannerStats
                      .reduce((sum, b) => sum + b.clicks, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Total Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(
                      (data.bannerStats.reduce((sum, b) => sum + b.clicks, 0) /
                        Math.max(
                          data.bannerStats.reduce(
                            (sum, b) => sum + b.impressions,
                            0
                          ),
                          1
                        )) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                  <div className="text-muted-foreground">Avg CTR</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No banner data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
