import mongoose from "mongoose";

const CreativeAssetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    creativeBriefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeBrief",
      required: true,
      index: true
    },

    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["image", "graphic", "video", "audio"],
      required: true
    },

    provider: String,

    providerAssetId: String,

    storageUrl: String,

    metadata: mongoose.Schema.Types.Mixed,

    generationConfig: mongoose.Schema.Types.Mixed,

    validation: {
      passed: Boolean,
      issues: [String]
    },

    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
      index: true
    },

    versions: [
      {
        storageUrl: String,
        createdAt: Date
      }
    ]
  },
  {
    timestamps: true
  }
);

CreativeAssetSchema.index({
  organizationId: 1,
  contentItemId: 1
});

export default mongoose.model("CreativeAsset", CreativeAssetSchema);
