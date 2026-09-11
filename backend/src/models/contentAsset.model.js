import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema(
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

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign"
    },

    strategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingStrategy"
    },

    personaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona"
    },

    parentContentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    },

    title: String,

    contentType: {
      type: String,
      enum: [
        "post",
        "carousel",
        "reel",
        "story",
        "blog",
        "email",
        "ad",
        "landing_page"
      ],
      required: true,
      index: true
    },

    channel: {
      type: String,
      enum: [
        "instagram",
        "email",
        "website",
        "blog",
        "meta_ads",
        "google_ads"
      ],
      required: true,
      index: true
    },

    funnelStage: {
      type: String,
      enum: [
        "awareness",
        "consideration",
        "conversion",
        "retention"
      ]
    },

    contentPillar: String,
    objective: String,
    hook: String,
    body: String,
    caption: String,
    callToAction: String,
    hashtags: [String],
    script: String,

    storyboard: [
      {
        sceneNumber: Number,
        description: String,
        narration: String,
        visualDirection: String,
        durationSeconds: Number
      }
    ],

    creativeBrief: {
      concept: String,
      visualDirection: String,
      targetEmotion: String,
      composition: String,
      aspectRatio: String,
      style: String
    },

    assetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContentAsset"
      }
    ],

    generatedBy: {
      type: String,
      enum: ["human", "ai", "hybrid"],
      default: "ai"
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    version: {
      type: Number,
      default: 1
    },

    status: {
      type: String,
      enum: [
        "draft",
        "review",
        "changes_requested",
        "approved",
        "scheduled",
        "published",
        "failed",
        "archived"
      ],
      default: "draft",
      index: true
    },

    scheduledAt: Date,
    publishedAt: Date,

    externalPublication: {
      platform: String,
      externalId: String,
      externalUrl: String
    },

    performanceSummary: {
      impressions: Number,
      reach: Number,
      engagement: Number,
      clicks: Number,
      conversions: Number
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

ContentSchema.index({
  organizationId: 1,
  channel: 1,
  status: 1
});

ContentSchema.index({
  organizationId: 1,
  scheduledAt: 1
});

export default mongoose.model("Content", ContentSchema);