/**
 * Inquiry Model - For customer product inquiries and contact forms
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// TypeScript interface
export interface IInquiry extends Document {
  _id: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "pending" | "in-progress" | "customer-feedback" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo?: mongoose.Types.ObjectId;
  notes?: Array<{
    adminId: mongoose.Types.ObjectId;
    note: string;
    timestamp: Date;
  }>;
  userComments?: Array<{
    comment: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const InquirySchema: Schema<IInquiry> = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "customer-feedback", "resolved", "closed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: [
      {
        adminId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        note: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userComments: [
      {
        comment: {
          type: String,
          required: true,
          maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ email: 1, createdAt: -1 });
InquirySchema.index({ assignedTo: 1, status: 1 });
InquirySchema.index({ productId: 1, createdAt: -1 });
InquirySchema.index({ userId: 1, createdAt: -1 });
InquirySchema.index({ createdAt: -1 });

// Virtual for product details (populated)
InquirySchema.virtual("product", {
  ref: "Product",
  localField: "productId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for user details (populated)
InquirySchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to validate email format
InquirySchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }
  // next();
});

// Static method to get pending inquiries count
InquirySchema.statics.getPendingCount = async function (): Promise<number> {
  return await this.countDocuments({ status: "pending" });
};

// Static method to get inquiries by status
InquirySchema.statics.getByStatus = async function (
  status: "pending" | "in-progress" | "customer-feedback" | "resolved" | "closed",
  limit: number = 50
): Promise<IInquiry[]> {
  return await this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("productId", "name slug")
    .populate("userId", "name email")
    .populate("assignedTo", "name email");
};

// Static method to assign inquiry to admin
InquirySchema.methods.assignToAdmin = async function (
  adminId: mongoose.Types.ObjectId
): Promise<IInquiry> {
  this.assignedTo = adminId;
  this.status = "in-progress";
  return await this.save();
};

// Static method to add note to inquiry
InquirySchema.methods.addNote = async function (
  adminId: mongoose.Types.ObjectId,
  note: string
): Promise<IInquiry> {
  this.notes.push({
    adminId,
    note,
    timestamp: new Date(),
  });
  return await this.save();
};

// Model
const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);

export default Inquiry;
