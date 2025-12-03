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
  image?: IImage;
  logo?: IImage;
  website?: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  clicks: number;
  impressions: number;
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
    image: ImageSchema,
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
    isFeatured: {
      type: Boolean,
      default: false,
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
    impressions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

TagSchema.pre("save", function () {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
});

// Note: name and slug already have indexes via `unique: true` in schema definition
TagSchema.index({ isActive: 1, isFeatured: 1, order: 1 });

export default models.Tag || model<ITag>("Tag", TagSchema);
