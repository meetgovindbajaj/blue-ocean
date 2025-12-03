import { model, Schema, Types, Document, models } from "mongoose";

type SlideContentType = "product" | "category" | "offer" | "custom" | "trending" | "new_arrivals";
type SlideSourceType = "manual" | "auto";

interface ISlideContent {
  productId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  discountPercent?: number;
  offerCode?: string;
  offerValidUntil?: Date;
  autoConfig?: {
    limit?: number;
    period?: "day" | "week" | "month" | "all";
    categoryFilter?: Types.ObjectId;
  };
}

interface IImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  isThumbnail: boolean;
  downloadUrl: string;
  size: number;
  width: number;
  height: number;
}

export interface IHeroBanner extends Document {
  id: string;
  name: string;
  contentType: SlideContentType;
  sourceType: SlideSourceType;
  content: ISlideContent;
  image: IImage;
  mobileImage?: IImage;
  order: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  clicks: number;
  impressions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = {
  id: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: "",
  },
  isThumbnail: {
    type: Boolean,
    default: false,
  },
  downloadUrl: {
    type: String,
    trim: true,
    default: "",
  },
  size: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
};

const OptionalImageSchema = {
  id: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: "",
  },
  isThumbnail: {
    type: Boolean,
    default: false,
  },
  downloadUrl: {
    type: String,
    trim: true,
    default: "",
  },
  size: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
};

const HeroBannerSchema = new Schema<IHeroBanner>(
  {
    id: { type: String, trim: true },
    name: {
      type: String,
      required: [true, "Banner name is required"],
      trim: true,
      maxlength: 100,
    },
    contentType: {
      type: String,
      enum: ["product", "category", "offer", "custom", "trending", "new_arrivals"],
      required: true,
      default: "custom",
    },
    sourceType: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    content: {
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
      title: { type: String, trim: true, maxlength: 200 },
      subtitle: { type: String, trim: true, maxlength: 300 },
      description: { type: String, trim: true, maxlength: 500 },
      ctaText: { type: String, trim: true, default: "Shop Now" },
      ctaLink: { type: String, trim: true },
      discountPercent: { type: Number, min: 0, max: 100 },
      offerCode: { type: String, trim: true },
      offerValidUntil: { type: Date },
      autoConfig: {
        limit: { type: Number, default: 5, min: 1, max: 20 },
        period: { type: String, enum: ["day", "week", "month", "all"], default: "week" },
        categoryFilter: { type: Schema.Types.ObjectId, ref: "Category" },
      },
    },
    image: ImageSchema,
    mobileImage: OptionalImageSchema,
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HeroBannerSchema.pre("save", function () {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
});

HeroBannerSchema.index({ isActive: 1, order: 1, startDate: 1, endDate: 1 });

export default models.HeroBanner || model<IHeroBanner>("HeroBanner", HeroBannerSchema);
