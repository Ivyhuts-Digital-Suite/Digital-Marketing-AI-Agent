import mongoose from "mongoose";

const RecommendationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    type: {
      type: String,
      enum: [
        "content",
        "campaign",
        "budget",
        "audience",
        "creative",
        "seo",
        "conversion",
        "channel",
        "technical"
      ]
    },

    title: {
      type: String,
      required: true
    },

    description: String,
    reasoning: String,

    evidence: [
      {
        metric: String,
        currentValue: Number,
        benchmark: Number,
        sourceId: mongoose.Schema.Types.ObjectId
      }
    ],

    proposedAction: {
      tool: String,
      parameters: mongoose.Schema.Types.Mixed
    },

    expectedImpact: {
      metric: String,
      estimatedChange: Number,
      confidence: Number
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"]
    },

    requiresApproval: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "executed",
        "expired",
        "failed"
      ],
      default: "pending",
      index: true
    },

    executedAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Recommendation", RecommendationSchema);