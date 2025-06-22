import mongoose, { models, Schema } from "mongoose";

const viewStatsSchema = new Schema<IViewLog>({
  type: { type: String, enum: ["product", "category"], required: true },
  refId: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
  ip: { type: String },
});

viewStatsSchema.index({ refId: 1, type: 1, viewedAt: -1 });
export default models.ViewLog ||
  mongoose.model<IViewLog>("ViewLog", viewStatsSchema);
