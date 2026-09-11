import mongoose from "mongoose";

const IntegrationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    provider: {
      type: String,
      enum: [
        "instagram",
        "meta",
        "google_ads",
        "google_analytics",
        "google_search_console",
        "email",
        "hubspot",
        "salesforce",
        "other"
      ],
      required: true
    },

    name: String,

    status: {
      type: String,
      enum: [
        "connected",
        "disconnected",
        "expired",
        "error",
        "pending"
      ],
      default: "pending"
    },

    permissions: [String],

    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    connectedAt: Date,

    lastSyncAt: Date,

    error: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Integration", IntegrationSchema);