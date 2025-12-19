import { model, Schema, Types, Document, models } from "mongoose";

// Event types for detailed tracking
export type EventType =
  | "page_view"
  | "product_view"
  | "product_click"
  | "category_view"
  | "category_click"
  | "banner_impression"
  | "banner_click"
  | "tag_impression"
  | "tag_click"
  | "search"
  | "add_to_inquiry"
  | "contact_submit";

// Entity types that can be tracked
export type EntityType = "product" | "category" | "banner" | "tag" | "page";

// Main Analytics Event - for detailed event logging
export interface IAnalyticsEvent extends Document {
  id: string;
  eventType: EventType;
  entityType: EntityType;
  entityId?: string;
  entitySlug?: string;
  entityName?: string;
  sessionId?: string;
  userId?: string;
  ip?: string;
  metadata?: {
    searchQuery?: string;
    referrer?: string;
    userAgent?: string;
    country?: string;
    city?: string;
    device?: string;
    browser?: string;
    os?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    position?: number;
    page?: string;
    previousPage?: string;
    // UTM Parameters
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    // Backlink tracking
    backlink_source?: string; // e.g., 'devto', 'hashnode'
    backlink_post?: string; // Post ID or slug
  };
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    id: { type: String, trim: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        "page_view",
        "product_view",
        "product_click",
        "category_view",
        "category_click",
        "banner_impression",
        "banner_click",
        "tag_impression",
        "tag_click",
        "search",
        "add_to_inquiry",
        "contact_submit",
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["product", "category", "banner", "tag", "page"],
      index: true,
    },
    entityId: { type: String, index: true },
    entitySlug: { type: String, index: true },
    entityName: { type: String },
    sessionId: { type: String, index: true },
    userId: { type: String, index: true },
    ip: { type: String, index: true },
    metadata: {
      searchQuery: { type: String },
      referrer: { type: String },
      userAgent: { type: String },
      country: { type: String },
      city: { type: String },
      device: { type: String },
      browser: { type: String },
      os: { type: String },
      source: { type: String },
      medium: { type: String },
      campaign: { type: String },
      position: { type: Number },
      page: { type: String },
      previousPage: { type: String },
      // UTM Parameters
      utm_source: { type: String, index: true },
      utm_medium: { type: String, index: true },
      utm_campaign: { type: String, index: true },
      utm_term: { type: String },
      utm_content: { type: String },
      // Backlink tracking
      backlink_source: { type: String, index: true },
      backlink_post: { type: String },
    },
  },
  { timestamps: true }
);

AnalyticsEventSchema.pre("save", function () {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
});

// Indexes for efficient querying
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ ip: 1, createdAt: -1 });

// Daily aggregation model for faster dashboard queries
export interface IDailyAnalytics extends Document {
  date: Date;
  entityType: EntityType;
  entityId: string;
  entitySlug?: string;
  entityName?: string;
  views: number;
  clicks: number;
  impressions: number;
  uniqueSessions: number;
  uniqueIps: number;
}

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>(
  {
    date: { type: Date, required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ["product", "category", "banner", "tag", "page"],
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    entitySlug: { type: String },
    entityName: { type: String },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    uniqueSessions: { type: Number, default: 0 },
    uniqueIps: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DailyAnalyticsSchema.index(
  { date: 1, entityType: 1, entityId: 1 },
  { unique: true }
);

export const AnalyticsEvent =
  models.AnalyticsEvent ||
  model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);
export const DailyAnalytics =
  models.DailyAnalytics ||
  model<IDailyAnalytics>("DailyAnalytics", DailyAnalyticsSchema);

export default AnalyticsEvent;
