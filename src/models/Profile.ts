import { model, Schema, Types, Document, models } from "mongoose";

interface IPreferences {
  newsletter: boolean;
  promotions: boolean;
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}
interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IProfile extends Document {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: IAddress;
  preferences: IPreferences;
  wishlist: Types.ObjectId[];
  recentlyViewed: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    id: { type: String, trim: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },
    preferences: {
      type: {
        newsletter: {
          type: Boolean,
          default: true,
        },
        promotions: {
          type: Boolean,
          default: true,
        },
        currency: {
          type: String,
          default: "INR",
          enum: ["INR", "USD", "EUR", "GBP"],
        },
        language: {
          type: String,
          default: "en",
          enum: ["en", "hi"],
        },
        notifications: {
          email: {
            type: Boolean,
            default: true,
          },
          sms: {
            type: Boolean,
            default: false,
          },
          push: {
            type: Boolean,
            default: true,
          },
        },
      },
      default: {
        newsletter: true,
        promotions: true,
        currency: "INR",
        language: "en",
        notifications: {
          email: false,
          sms: false,
          push: false,
        },
      },
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product", default: [] }],
    recentlyViewed: [
      { type: Schema.Types.ObjectId, ref: "Product", default: [] },
    ],
  },
  { timestamps: true }
);
// ✅ Pre-save: assign _id to id if not set
ProfileSchema.pre("save", function (this: IProfile, next) {
  if (!this.id) {
    this.id = (this._id as Types.ObjectId).toString();
  }
  // next();
});
const Profile = models.Profile || model<IProfile>("Profile", ProfileSchema);

export default Profile;
