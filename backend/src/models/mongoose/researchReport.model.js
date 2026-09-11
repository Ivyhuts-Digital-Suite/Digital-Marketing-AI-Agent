import mongoose from "mongoose";

const ResearchReportSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: [
        "market",
        "competitor",
        "customer",
        "keyword",
        "trend",
        "content_gap",
        "industry"
      ],
      required: true
    },

    title: String,
    query: String,
    summary: String,

    findings: [
      {
        title: String,
        description: String,
        importance: Number,
        confidence: Number
      }
    ],

    opportunities: [String],
    threats: [String],
    recommendations: [String],

    sourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ResearchSource"
      }
    ],

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    generatedAt: Date,
    expiresAt: Date,

    status: {
      type: String,
      enum: ["draft", "completed", "stale", "archived"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ResearchReport", ResearchReportSchema);