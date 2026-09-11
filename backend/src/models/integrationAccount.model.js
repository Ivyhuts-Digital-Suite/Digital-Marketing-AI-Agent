import mongoose from "mongoose";

const IntegrationAccountSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },

    provider: String,

    externalAccountId: String,

    accountName: String,

    externalBusinessId: String,

    metadata: mongoose.Schema.Types.Mixed,

    tokenReference: String,

    tokenExpiresAt: Date,

    status: {
      type: String,
      enum: ["active", "expired", "revoked", "error"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

IntegrationAccountSchema.index({
  organizationId: 1,
  provider: 1,
  externalAccountId: 1
});

export default mongoose.model(
  "IntegrationAccount",
  IntegrationAccountSchema
);