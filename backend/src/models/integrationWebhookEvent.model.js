import mongoose from "mongoose";

const IntegrationWebhookEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },

    provider: {
      type: String,
      enum: ["meta", "google_ads", "email", "crm"],
      required: true
    },

    integrationAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IntegrationAccount"
    },

    eventType: String,

    externalEventId: {
      type: String,
      required: true
    },

    rawPayload: mongoose.Schema.Types.Mixed,
    normalizedPayload: mongoose.Schema.Types.Mixed,

    status: {
      type: String,
      enum: ["received", "processing", "processed", "failed", "ignored"],
      default: "received",
      index: true
    },

    processingError: String,

    receivedAt: Date,
    processedAt: Date
  },
  {
    timestamps: true
  }
);

IntegrationWebhookEventSchema.index(
  {
    provider: 1,
    externalEventId: 1
  },
  {
    unique: true
  }
);

export default mongoose.model(
  "IntegrationWebhookEvent",
  IntegrationWebhookEventSchema
);
