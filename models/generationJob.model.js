import mongoose from "mongoose";

const GenerationJobSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true
    },

    provider: String,

    request: mongoose.Schema.Types.Mixed,

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
      index: true
    },

    progress: {
      type: Number,
      default: 0
    },

    outputAssetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreativeAsset"
      }
    ],

    error: {
      code: String,
      message: String
    },

    startedAt: Date,

    completedAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model("GenerationJob", GenerationJobSchema);
