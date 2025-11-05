import { model, Schema, Document, models } from "mongoose";

export interface IAgentMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    context?: string[];
  };
}

export interface IConversation extends Document {
  id: string;
  conversationId: string;
  userId?: string;
  messages: IAgentMessage[];
  metadata: {
    startTime: Date;
    lastUpdate: Date;
    messageCount: number;
    topic?: string;
    status: "active" | "archived" | "deleted";
  };
  analytics: {
    avgResponseTime: number;
    totalTokens: number;
    userSatisfaction?: number;
  };
}

const AgentMessageSchema = new Schema<IAgentMessage>(
  {
    id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "agent", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      tokens: Number,
      model: String,
      context: [String],
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    id: {
      type: String,
      trim: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    messages: [AgentMessageSchema],
    metadata: {
      startTime: {
        type: Date,
        default: Date.now,
      },
      lastUpdate: {
        type: Date,
        default: Date.now,
      },
      messageCount: {
        type: Number,
        default: 0,
      },
      topic: String,
      status: {
        type: String,
        enum: ["active", "archived", "deleted"],
        default: "active",
      },
    },
    analytics: {
      avgResponseTime: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
      userSatisfaction: Number,
    },
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

// Pre-save: assign _id to id if not set
ConversationSchema.pre("save", function (next) {
  if (!this.id && this._id) {
    this.id = this._id.toString();
  }
  this.metadata.lastUpdate = new Date();
  this.metadata.messageCount = this.messages.length;
  next();
});

// Index for efficient querying
ConversationSchema.index({ conversationId: 1, "metadata.status": 1 });
ConversationSchema.index({ userId: 1, "metadata.lastUpdate": -1 });

export default models.Conversation ||
  model<IConversation>("Conversation", ConversationSchema);
