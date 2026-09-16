import mongoose from "mongoose";

const IntegrationSyncSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true
    },

    provider: String,

    syncType: {
      type: String,
      enum: [
        "content",
        "campaigns",
        "analytics",
        "leads",
        "accounts"
      ]
    },

    startedAt: Date,

    completedAt: Date,

    recordsProcessed: Number,

    recordsCreated: Number,

    recordsUpdated: Number,

    status: {
      type: String,
      enum: [
        "queued",
        "running",
        "completed",
        "failed"
      ],
      default: "queued"
    },

    error: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "IntegrationSync",
  IntegrationSyncSchema
);