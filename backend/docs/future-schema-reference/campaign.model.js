import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },

    strategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingStrategy"
    },

    name: {
      type: String,
      required: true
    },

    description: String,

    type: {
      type: String,
      enum: [
        "organic",
        "paid",
        "email",
        "content",
        "lead_generation",
        "brand_awareness",
        "conversion"
      ],
      required: true
    },

    channels: [String],
    objective: String,

    targetPersonas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Persona"
      }
    ],

    budget: {
      amount: Number,
      currency: String,
      dailyLimit: Number
    },

    startDate: Date,
    endDate: Date,

    kpis: [
      {
        metric: String,
        target: Number,
        unit: String
      }
    ],

    contentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content"
      }
    ],

    assetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CampaignAsset"
      }
    ],

    externalCampaigns: [
      {
        platform: String,
        externalId: String,
        status: String
      }
    ],

    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "scheduled",
        "active",
        "paused",
        "completed",
        "cancelled",
        "failed"
      ],
      default: "draft",
      index: true
    },

    createdBy: {
      type: String,
      enum: ["human", "ai", "hybrid"]
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Campaign", CampaignSchema);