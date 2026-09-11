import mongoose from "mongoose";

const ExperimentResultSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    experimentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
      index: true
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperimentVariant",
      required: true
    },

    sampleSize: Number,

    metrics: [
      {
        metric: String,
        value: Number,
        baselineValue: Number,
        change: Number,
        changePercentage: Number
      }
    ],

    statisticalResult: {
      confidence: Number,
      pValue: Number,
      significant: Boolean
    },

    businessImpact: {
      estimatedRevenue: Number,
      estimatedCost: Number,
      roi: Number
    },

    evaluatedAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "ExperimentResult",
  ExperimentResultSchema
);