import { model, Schema, Types, Document, models } from "mongoose";
import Category from "./Category";
interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  size: {
    length: number;
    width: number;
    height: number;
    fixedSize: boolean;
    unit: "cm" | "mm" | "in" | "ft";
  };
  category: Types.ObjectId;
  images: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  }[];
  breadcrumbs: { id: string; name: string; slug: string }[];
  isActive: boolean;
}
const ProductSchema = new Schema<IProduct>(
  {
    id: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    prices: {
      wholesale: {
        type: Number,
        min: 0,
        default: 0,
      },
      retail: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    size: {
      length: {
        type: Number,
        min: 0,
        default: 0,
      },
      width: {
        type: Number,
        min: 0,
        default: 0,
      },
      height: {
        type: Number,
        min: 0,
        default: 0,
      },
      fixedSize: {
        type: Boolean,
        default: false,
      },
      unit: {
        type: String,
        enum: ["cm", "mm", "in", "ft"],
        default: "cm",
      },
    },
    images: [
      {
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
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        delete ret._id;
        return ret;
      },
    },
  }
);

// ✅ Pre-save: assign _id to id if not set
ProductSchema.pre("save", function (this: IProduct, next) {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
  if (this.images && this.images.length > 0) {
    this.images.map((image) => {
      if (!image.isThumbnail && image.thumbnailUrl.length > 0) {
        image.isThumbnail = true;
      }
    });
  }
  next();
});

// ✅ Auto-populate category on find

// ✅ Breadcrumb virtual
ProductSchema.virtual("breadcrumbs").get(async function (this: IProduct) {
  const breadcrumbs = [];
  let currentCategory = this.category as typeof Category.prototype | null;

  // Traverse parents upward
  while (currentCategory) {
    breadcrumbs.unshift({
      id: currentCategory.id,
      name: currentCategory.name,
      slug: currentCategory.slug,
    });

    if (!currentCategory.parent) break;

    currentCategory = await Category.findById(currentCategory.parent).select(
      "id name slug parent"
    );
  }

  return breadcrumbs;
});

export default models.Product || model<IProduct>("Product", ProductSchema);
