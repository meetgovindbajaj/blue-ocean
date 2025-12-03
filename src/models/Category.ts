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

CategorySchema.pre("save", function (next) {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
  // next();
});
CategorySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (!update) return;

  // Skip middleware if _skipMiddleware option is set (handled by API route)
  const options = this.getOptions();
  if (options._skipMiddleware) return;

  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate) return;

  const currentId = docToUpdate._id;

  // ===== Handle Parent Change =====
  if (
    typeof update === "object" &&
    update !== null &&
    "parent" in update
  ) {
    const newParent = (update as { parent?: Types.ObjectId | null }).parent;
    const oldParent = docToUpdate.parent;
    const newParentStr = newParent?.toString() || null;
    const oldParentStr = oldParent?.toString() || null;

    if (newParentStr !== oldParentStr) {
      // Remove from old parent's children
      if (oldParent) {
        await this.model.findByIdAndUpdate(oldParent, {
          $pull: { children: currentId },
        });
      }

      // Add to new parent's children (if not null)
      if (newParent) {
        await this.model.findByIdAndUpdate(newParent, {
          $addToSet: { children: currentId },
        });
      }
    }
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
    }

    if (addedChildren.length > 0) {
      // Remove added children from their previous parents' children arrays
      const addedCats = await this.model
        .find({ _id: { $in: addedChildren } })
        .select("parent");
      for (const addedCat of addedCats) {
        if (
          addedCat.parent &&
          addedCat.parent.toString() !== currentId.toString()
        ) {
          await this.model.findByIdAndUpdate(addedCat.parent, {
            $pull: { children: addedCat._id },
          });
        }
      }

      // Set new children's parent to this category
      await this.model.updateMany(
        { _id: { $in: addedChildren } },
        { $set: { parent: currentId } }
      );
    }
  }

  // no next()
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
  async function () {
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

    // no next()
  }
);

CategorySchema.index({ name: "text", description: "text" });
CategorySchema.index({ parent: 1, isActive: 1 });

export default models.Category || model<ICategory>("Category", CategorySchema);
