import { TokenType } from "@/lib/properties";
import { model, Schema, Types, Document, models } from "mongoose";

export interface IToken extends Document {
  user: Types.ObjectId;
  token: string;
  type: TokenType;
  expiresAt: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: TokenType,
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TokenSchema.index({ user: 1, type: 1 });

TokenSchema.pre("save", async function (this: IToken, next) {
  if (!this.expiresAt) {
    let expirationMinutes: number;

    switch (this.type) {
      case TokenType.AUTH:
        expirationMinutes = 1440; // 24 hours
        break;
      case TokenType.EMAIL_VERIFICATION:
        expirationMinutes = 1440; // 24 hours
        break;
      case TokenType.RESET_PASSWORD:
        expirationMinutes = 60; // 1 hour
        break;
      case TokenType.PHONE_VERIFICATION:
        expirationMinutes = 15; // 15 minutes
        break;
      case TokenType.ACTIVATION:
        expirationMinutes = 60; // 1 hour
        break;
      default:
        expirationMinutes = 15; // Default 15 minutes
    }

    this.expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  }
  // next();
});
export default models.Token || model<IToken>("Token", TokenSchema);
