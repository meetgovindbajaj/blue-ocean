import { model, Schema, Types, Document, models } from "mongoose";
import Profile, { IProfile } from "./Profile";
import { AuthType, UserRole, UserStatus } from "@/lib/properties";

interface IUser extends Document {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  authType: IAuthType;
  isVerified: boolean;
  emailVerifiedAt?: Date;
  googleId?: string;
  role: IUserRole;
  status: IUserStatus;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  permissions: string[];
  profile: Types.ObjectId;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false, // Exclude from queries by default
    },
    authType: {
      type: String,
      enum: AuthType,
      default: AuthType.MANUAL,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    googleId: {
      type: String,
      select: false, // Exclude from queries by default
    },
    role: {
      type: String,
      enum: UserRole,
      default: UserRole.CUSTOMER,
    },
    status: {
      type: String,
      enum: UserStatus,
      default: UserStatus.PENDING,
    },
    lastLogin: Date,
    lastPasswordChange: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    permissions: {
      type: [String],
      default: [],
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Exclude from queries by default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Pre-save: assign _id to id if not set
UserSchema.pre("save", async function (this: IUser, next) {
  const id = (this._id as Types.ObjectId).toString();
  if (!this.id) {
    this.id = id;
  }
  if (!this.profile) {
    const payload: Partial<IProfile> = {
      name: this.name,
      email: this.email,
    };
    const userProfile = await new Profile(payload).save();
    this.profile = userProfile._id;
  }
  // next();
});
// Virtual for account lock status
UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});
// Methods
UserSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 }, $set: {} };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

UserSchema.methods.hasPermission = function (permission: string): boolean {
  if (this.role === UserRole.SUPER_ADMIN) return true;
  return this.permissions.includes(permission);
};

UserSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.role === role;
};

UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

export default models.User || model<IUser>("User", UserSchema);
