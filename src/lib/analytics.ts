import { NextRequest } from "next/server";
import { AnalyticsEvent, DailyAnalytics, EventType, EntityType } from "@/models/Analytics";
import Product from "@/models/Product";
import Category from "@/models/Category";
import HeroBanner from "@/models/HeroBanner";

// Get client IP with proper priority
export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return cfIp || forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1";
}

// Get day bucket for daily aggregation
export function getDayBucket(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Deduplication window in milliseconds (5 minutes)
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

// Track analytics event with full IP tracking and daily aggregation
export async function trackEvent(data: {
  eventType: EventType;
  entityType: EntityType;
  entityId: string;
  entitySlug?: string;
  entityName?: string;
  sessionId?: string;
  userId?: string;
  ip: string;
  metadata?: Record<string, any>;
  skipDedup?: boolean; // For impressions and other events that should always be recorded
}) {
  try {
    // Deduplication: Check if same event was recorded recently for this IP/session/entity
    // Skip dedup for impressions (should always be counted) or when explicitly skipped
    if (!data.skipDedup && data.eventType.includes("view")) {
      const dedupWindow = new Date(Date.now() - DEDUP_WINDOW_MS);

      const recentEvent = await AnalyticsEvent.findOne({
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        $or: [
          { ip: data.ip },
          ...(data.sessionId ? [{ sessionId: data.sessionId }] : []),
          ...(data.userId ? [{ userId: data.userId }] : []),
        ],
        createdAt: { $gte: dedupWindow },
      }).lean();

      if (recentEvent) {
        // Already recorded recently, skip duplicate
        return null;
      }
    }

    // 1. Create detailed event log
    const event = new AnalyticsEvent({
      eventType: data.eventType,
      entityType: data.entityType,
      entityId: data.entityId,
      entitySlug: data.entitySlug,
      entityName: data.entityName,
      sessionId: data.sessionId,
      userId: data.userId,
      ip: data.ip,
      metadata: data.metadata,
    });
    await event.save();

    // 2. Update daily aggregates
    const today = getDayBucket();
    const updateOp: any = {};

    if (data.eventType.includes("view")) updateOp.views = 1;
    if (data.eventType.includes("click")) updateOp.clicks = 1;
    if (data.eventType.includes("impression")) updateOp.impressions = 1;

    if (Object.keys(updateOp).length > 0) {
      await DailyAnalytics.findOneAndUpdate(
        { date: today, entityType: data.entityType, entityId: data.entityId },
        {
          $inc: updateOp,
          $setOnInsert: {
            entitySlug: data.entitySlug,
            entityName: data.entityName,
          },
        },
        { upsert: true }
      );
    }

    // 3. Update entity-specific counters
    await updateEntityCounters(data.entityType, data.entityId, data.eventType);

    return event;
  } catch (error) {
    console.error("Track event error:", error);
    return null;
  }
}

// Update counters on the entity models
async function updateEntityCounters(
  entityType: EntityType,
  entityId: string,
  eventType: EventType
) {
  try {
    if (entityType === "product") {
      if (eventType.includes("view")) {
        await Product.findByIdAndUpdate(entityId, { $inc: { totalViews: 1 } });
      }
    } else if (entityType === "category") {
      if (eventType.includes("view")) {
        await Category.findByIdAndUpdate(entityId, { $inc: { totalViews: 1 } });
      }
    } else if (entityType === "banner") {
      if (eventType.includes("click")) {
        await HeroBanner.findByIdAndUpdate(entityId, { $inc: { clicks: 1 } });
      }
      if (eventType.includes("impression")) {
        await HeroBanner.findByIdAndUpdate(entityId, { $inc: { impressions: 1 } });
      }
    }
  } catch (error) {
    console.error("Update entity counters error:", error);
  }
}

// Get aggregated stats for an entity
export async function getEntityStats(
  entityType: EntityType,
  entityId: string,
  days: number = 30
) {
  try {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType,
          entityId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
          uniqueIps: { $addToSet: "$ip" },
          uniqueSessions: { $addToSet: "$sessionId" },
        },
      },
    ]);

    const result = {
      views: 0,
      clicks: 0,
      impressions: 0,
      uniqueVisitors: 0,
    };

    const allIps = new Set<string>();
    stats.forEach((stat: any) => {
      if (stat._id?.includes("view")) result.views += stat.count;
      if (stat._id?.includes("click")) result.clicks += stat.count;
      if (stat._id?.includes("impression")) result.impressions += stat.count;
      stat.uniqueIps?.forEach((ip: string) => {
        if (ip) allIps.add(ip);
      });
    });
    result.uniqueVisitors = allIps.size;

    return result;
  } catch (error) {
    console.error("Get entity stats error:", error);
    return { views: 0, clicks: 0, impressions: 0, uniqueVisitors: 0 };
  }
}

// Get top viewed products from analytics
export async function getTopViewedProducts(days: number = 7, limit: number = 10) {
  try {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType: "product",
          eventType: "product_view",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$entityId",
          views: { $sum: 1 },
          entityName: { $first: "$entityName" },
          entitySlug: { $first: "$entitySlug" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    return stats;
  } catch (error) {
    console.error("Get top viewed products error:", error);
    return [];
  }
}

// Get trending products based on recent activity
export async function getTrendingProducts(period: "day" | "week" | "month" = "week", limit: number = 10) {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          entityType: "product",
          eventType: "product_view",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$entityId",
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$ip" },
        },
      },
      {
        $addFields: {
          uniqueCount: { $size: "$uniqueVisitors" },
          // Score: views + (unique visitors * 2) for better ranking
          score: { $add: ["$views", { $multiply: [{ $size: "$uniqueVisitors" }, 2] }] },
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    return stats.map((s: any) => ({
      entityId: s._id,
      views: s.views,
      uniqueVisitors: s.uniqueCount,
      score: s.score,
    }));
  } catch (error) {
    console.error("Get trending products error:", error);
    return [];
  }
}

// Get dashboard analytics summary
export async function getDashboardStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const [totalStats, dailyStats] = await Promise.all([
      // Total stats by entity type
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { entityType: "$entityType", eventType: "$eventType" },
            count: { $sum: 1 },
          },
        },
      ]),
      // Daily breakdown
      DailyAnalytics.find({ date: { $gte: startDate } })
        .sort({ date: -1 })
        .lean(),
    ]);

    return {
      totalStats,
      dailyStats,
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return { totalStats: [], dailyStats: [] };
  }
}
