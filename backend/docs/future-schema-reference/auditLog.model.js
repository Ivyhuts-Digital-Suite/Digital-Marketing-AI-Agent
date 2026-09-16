import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    actorType: {
      type: String,
      enum: ["user", "agent", "system"],
      required: true
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId
    },

    action: {
      type: String,
      required: true,
      index: true
    },

    entityType: String,

    entityId: mongoose.Schema.Types.ObjectId,

    previousState: mongoose.Schema.Types.Mixed,

    newState: mongoose.Schema.Types.Mixed,

    metadata: mongoose.Schema.Types.Mixed,

    ipAddress: String,

    userAgent: String
  },
  {
    timestamps: true
  }
);

AuditLogSchema.index({
  organizationId: 1,
  createdAt: -1
});

export default mongoose.model("AuditLog", AuditLogSchema);