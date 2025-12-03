import mongoose, { models, Schema, Types } from "mongoose";
export type ViewTrackedType = "product" | "category";

export interface IViewStats extends Document {
  type: ViewTrackedType;
  refId: Types.ObjectId; // product or category _id
  ip?: string | null; // anonymous users
  userId?: Types.ObjectId | null; // logged-in users
  day: Date; // UTC day bucket (midnight)
  count: number;
  createdAt: Date;
  updatedAt: Date;
}
const viewStatsSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["product", "category"],
      required: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    ip: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    day: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Unique per (type, refId, day, ip, userId)
// - logged-in users: userId set, ip = null
// - anonymous users: ip set, userId = null
viewStatsSchema.index(
  { type: 1, refId: 1, day: 1, ip: 1, userId: 1 },
  { unique: true }
);

// For analytics & popular products
viewStatsSchema.index({ type: 1, refId: 1, day: 1 });
viewStatsSchema.index({ day: 1 });

export default models.ViewStats || mongoose.model("ViewStats", viewStatsSchema);
