import mongoose from "mongoose";

const ExperimentSchema = new mongoose.Schema(
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

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign"
    },

    name: {
      type: String,
      required: true
    },

    hypothesis: {
      type: String,
      required: true
    },

    objective: String,
    primaryMetric: String,
    secondaryMetrics: [String],

    baseline: {
      metric: String,
      value: Number
    },

    minimumDetectableEffect: Number,
    confidenceLevel: Number,
    startDate: Date,
    endDate: Date,

    winnerVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperimentVariant"
    },

    learningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentLearning"
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "running",
        "completed",
        "cancelled"
      ],
      default: "draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Experiment", ExperimentSchema);