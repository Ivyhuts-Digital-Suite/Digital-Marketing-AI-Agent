import mongoose from "mongoose";

const MarketingStrategySchema = new mongoose.Schema(
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

    version: {
      type: Number,
      required: true
    },

    name: String,
    objective: String,
    executiveSummary: String,

    targetAudience: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Persona"
      }
    ],

    positioning: String,

    messaging: {
      coreMessage: String,
      valueProposition: String,
      keyMessages: [String]
    },

    funnel: {
      awareness: [String],
      consideration: [String],
      conversion: [String],
      retention: [String]
    },

    channels: [
      {
        channel: String,
        priority: Number,
        purpose: String,
        expectedOutcome: String
      }
    ],

    contentPillars: [
      {
        name: String,
        description: String,
        percentage: Number
      }
    ],

    budgetRecommendation: {
      total: Number,
      currency: String,

      allocation: [
        {
          channel: String,
          percentage: Number,
          amount: Number
        }
      ]
    },

    kpis: [
      {
        name: String,
        target: Number,
        unit: String
      }
    ],

    risks: [String],
    assumptions: [String],

    sourceResearchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ResearchReport"
      }
    ],

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    status: {
      type: String,
      enum: ["draft", "active", "superseded", "archived"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

MarketingStrategySchema.index(
  {
    organizationId: 1,
    companyId: 1,
    version: -1
  },
  {
    unique: true
  }
);

export default mongoose.model(
  "MarketingStrategy",
  MarketingStrategySchema
);