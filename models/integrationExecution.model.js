import mongoose from "mongoose";

const IntegrationExecutionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    integrationAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IntegrationAccount",
      required: true,
      index: true
    },

    operation: String,

    toolName: String,

    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    actorType: {
      type: String,
      enum: ["user", "agent", "system"],
      required: true
    },

    actorId: String,

    idempotencyKey: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
      index: true
    },

    externalResourceId: String,

    requestMetadata: mongoose.Schema.Types.Mixed,
    responseMetadata: mongoose.Schema.Types.Mixed,

    errorCode: String,
    errorMessage: String,

    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

IntegrationExecutionSchema.index(
  {
    organizationId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

export default mongoose.model(
  "IntegrationExecution",
  IntegrationExecutionSchema
);
