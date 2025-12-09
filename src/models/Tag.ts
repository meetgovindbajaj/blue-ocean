import { model, Schema, Types, Document, models } from "mongoose";

// Tags are standalone entities (like brands/affiliates)
// Not related to products - used for featured sections, partnerships, etc.

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

interface ITag extends Document {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: IImage;
  website?: string;
  isActive: boolean;
  order: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = {
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

const TagSchema = new Schema<ITag>(
  {
    id: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      unique: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: ImageSchema,
    website: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-increment order for new tags
TagSchema.pre("save", async function () {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }

  // Auto-set order for new tags
  if (this.isNew && this.order === 0) {
    const Tag = models.Tag || model<ITag>("Tag", TagSchema);
    const maxOrderTag = await Tag.findOne({}).sort({ order: -1 }).select("order").lean();
    this.order = maxOrderTag ? (maxOrderTag as any).order + 1 : 1;
  }
});

// Note: name and slug already have indexes via `unique: true` in schema definition
TagSchema.index({ isActive: 1, order: 1 });

export default models.Tag || model<ITag>("Tag", TagSchema);
