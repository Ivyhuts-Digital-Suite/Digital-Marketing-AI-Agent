import mongoose from "mongoose";

const ApprovalSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    entityType: {
      type: String,
      enum: [
        "content",
        "campaign",
        "recommendation",
        "experiment",
        "integration_action",
        "budget_change"
      ],
      required: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    action: {
      type: String,
      required: true
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },

    payload: mongoose.Schema.Types.Mixed,

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "changes_requested",
        "expired"
      ],
      default: "pending",
      index: true
    },

    reviewerComment: String,

    expiresAt: Date,

    reviewedAt: Date
  },
  {
    timestamps: true
  }
);

ApprovalSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1
});

export default mongoose.model("Approval", ApprovalSchema);