import mongoose from "mongoose";

const ExperimentVariantSchema = new mongoose.Schema(
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

    name: String,

    type: {
      type: String,
      enum: ["control", "variant"],
      required: true
    },

    description: String,

    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentAsset"
    },

    allocationPercentage: Number,
    status: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "ExperimentVariant",
  ExperimentVariantSchema
);