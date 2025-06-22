import mongoose, { models, Schema } from "mongoose";

const viewStatsSchema = new Schema(
  {
    type: { type: String, enum: ["product", "category"], required: true },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "type", // Dynamic reference based on `type`
    },
    viewedAt: { type: Date, default: Date.now },
    ip: { type: String, required: true }, // Unique IP for each view
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

viewStatsSchema.index(
  { refId: 1, type: 1, ip: 1, viewedAt: 1 },
  { unique: true }
);
export default models.ViewStats || mongoose.model("ViewStats", viewStatsSchema);
