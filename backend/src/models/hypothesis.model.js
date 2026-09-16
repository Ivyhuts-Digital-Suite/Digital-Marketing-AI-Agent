import mongoose from "mongoose";

const HypothesisSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    statement: {
      type: String,
      required: true
    },

    category: String,
    independentVariable: String,
    dependentMetric: String,
    targetAudience: String,
    channel: String,
    contentType: String,

    expectedDirection: {
      type: String,
      enum: ["increase", "decrease", "no_change"]
    },

    rationale: String,

    createdBy: {
      type: String,
      enum: ["human", "agent"],
      default: "human"
    },

    sourceAgentType: {
      type: String,
      enum: ["analytics", "optimization", "strategy"]
    },

    confidence: {
      type: String,
      enum: ["low", "medium", "high"]
    },

    status: {
      type: String,
      enum: ["proposed", "testing", "tested", "archived"],
      default: "proposed",
      index: true
    }
  },
  {
    timestamps: true
  }
);

HypothesisSchema.index({
  organizationId: 1,
  status: 1
});

export default mongoose.model("Hypothesis", HypothesisSchema);
