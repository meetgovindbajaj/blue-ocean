import { model, Schema, Types, Document, models } from "mongoose";
import Product from "./Product";

interface ICategory extends Document {
  id: string;
  name: string;
  slug: string;
  parent?: Types.ObjectId;
  description?: string;
  image: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  };
  isActive: true | false;
  children: Types.ObjectId[];
}

const CategorySchema = new Schema<ICategory>(
  {
    id: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      index: true,
    },
    image: {
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
      thumbnailUrl: String,
      isThumbnail: {
        type: Boolean,
        required: true,
        default: true,
      },
      downloadUrl: {
        type: String,
      },
      size: Number,
      width: Number,
      height: Number,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    children: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

CategorySchema.pre<ICategory>("save", function (next) {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
  next();
});
CategorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const docToUpdate = await this.model.findOne(this.getQuery());

  if (!docToUpdate) return next();

  const currentId = docToUpdate._id;

  // ===== Handle Parent Change =====
  if (
    typeof update === "object" &&
    update !== null &&
    "parent" in update &&
    update.parent &&
    update.parent.toString() !== docToUpdate.parent?.toString()
  ) {
    // Remove from old parent's children
    if (docToUpdate.parent) {
      await this.model.findByIdAndUpdate(docToUpdate.parent, {
        $pull: { children: currentId },
      });
    }

    // Add to new parent's children
    await this.model.findByIdAndUpdate(update.parent, {
      $addToSet: { children: currentId },
    });
  }

  // ===== Handle Children Change =====
  if (
    typeof update === "object" &&
    update !== null &&
    "children" in update &&
    Array.isArray((update as { children?: Types.ObjectId[] }).children)
  ) {
    const newChildren = (update as { children: Types.ObjectId[] }).children.map(
      (id) => id.toString()
    );
    const prevChildren: string[] = docToUpdate.children.map(
      (id: Types.ObjectId) => id.toString()
    );

    const removedChildren = prevChildren.filter(
      (id) => !newChildren.includes(id)
    );
    const addedChildren = newChildren.filter(
      (id) => !prevChildren.includes(id)
    );

    if (removedChildren.length > 0) {
      // Set removed children's parent to null
      await this.model.updateMany(
        { _id: { $in: removedChildren } },
        { $set: { parent: null } }
      );

      // Remove removed children from this category's children array (redundant but safe)
      await this.model.findByIdAndUpdate(currentId, {
        $pull: { children: { $in: removedChildren } },
      });
    }

    if (addedChildren.length > 0) {
      // Set new children's parent to this category
      await this.model.updateMany(
        { _id: { $in: addedChildren } },
        { $set: { parent: currentId } }
      );
    }
  }

  next();
});
// After save, update parent's children list
CategorySchema.post<ICategory>("save", async function (doc, next) {
  const Category = model<ICategory>("Category");
  if (doc.parent) {
    await Category.findByIdAndUpdate(doc.parent, {
      $addToSet: { children: doc._id },
    });
  }
  if (doc.children && doc.children.length > 0) {
    await Category.updateMany(
      { _id: { $in: doc.children } },
      { $set: { parent: doc._id } }
    );
  }
  next();
});

// Before remove, remove self from parent's children
CategorySchema.pre<ICategory>(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const Category = model<ICategory>("Category");
    const doc = this as ICategory;

    if (doc.parent) {
      await Category.findByIdAndUpdate(doc.parent, {
        $pull: { children: doc._id },
      });
    }

    if (doc.children && doc.children.length > 0) {
      await Category.updateMany(
        { _id: { $in: doc.children } },
        { $set: { parent: null } }
      );
    }
    // Set related products inactive
    await Product.updateMany(
      { category: doc._id },
      { $set: { isActive: false } }
    );

    next();
  }
);

export default models.Category || model<ICategory>("Category", CategorySchema);
