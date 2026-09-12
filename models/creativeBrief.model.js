import mongoose from "mongoose";

const CreativeBriefSchema = new mongoose.Schema(
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

    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true
    },

    strategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingStrategy"
    },

    objective: String,

    audience: String,

    platform: {
      type: String,
      enum: ["instagram"],
      default: "instagram"
    },

    format: {
      type: String,
      enum: ["post", "carousel", "reel", "story"],
      required: true
    },

    funnelStage: String,

    coreMessage: String,

    hook: String,

    emotionalTone: String,

    visualDirection: {
      style: String,
      mood: String,
      composition: String
    },

    keyElements: [String],

    brandRequirements: [String],

    cta: String,

    generatedBy: {
      type: String,
      enum: ["human", "ai", "hybrid"],
      default: "ai"
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    status: {
      type: String,
      enum: ["draft", "approved", "used", "archived"],
      default: "draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

CreativeBriefSchema.index({
  organizationId: 1,
  contentItemId: 1
});

export default mongoose.model("CreativeBrief", CreativeBriefSchema);
