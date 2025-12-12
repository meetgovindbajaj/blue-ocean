import { model, Schema, Document, models } from "mongoose";

export type LegalDocumentType =
  | "terms-and-conditions"
  | "privacy-policy"
  | "terms-of-service"
  | "refund-policy"
  | "warranty"
  | "trade-contracts"
  | "certificates";

export type ContentFormat = "rich-text" | "pdf" | "image";

interface ILegalDocument extends Document {
  type: LegalDocumentType;
  title: string;
  slug: string;
  format: ContentFormat;
  // Rich text content
  content?: string;
  // For PDF/Image format
  file?: {
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
  // Multiple images for image format
  images?: {
    url: string;
    name: string;
    order: number;
  }[];
  isVisible: boolean;
  order: number;
  lastUpdatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegalDocumentSchema = new Schema<ILegalDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "terms-and-conditions",
        "privacy-policy",
        "terms-of-service",
        "refund-policy",
        "warranty",
        "trade-contracts",
        "certificates",
      ],
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    format: {
      type: String,
      required: true,
      enum: ["rich-text", "pdf", "image"],
      default: "rich-text",
    },
    content: {
      type: String,
      default: "",
    },
    file: {
      url: String,
      name: String,
      size: Number,
      mimeType: String,
    },
    images: [
      {
        url: { type: String, required: true },
        name: String,
        order: { type: Number, default: 0 },
      },
    ],
    isVisible: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes
LegalDocumentSchema.index({ type: 1 });
LegalDocumentSchema.index({ slug: 1 });
LegalDocumentSchema.index({ isVisible: 1 });

const LegalDocument =
  models.LegalDocument ||
  model<ILegalDocument>("LegalDocument", LegalDocumentSchema);

export default LegalDocument;
