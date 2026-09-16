import mongoose from "mongoose";

const AgentTaskSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTask"
    },

    type: String,

    request: {
      type: String,
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal"
    },

    requestedAgent: {
      type: String,
      enum: [
        "orchestrator",
        "research",
        "strategy",
        "content",
        "campaign",
        "analytics",
        "optimization"
      ]
    },

    status: {
      type: String,
      enum: [
        "queued",
        "running",
        "waiting_approval",
        "completed",
        "failed",
        "cancelled"
      ],
      default: "queued",
      index: true
    },

    context: mongoose.Schema.Types.Mixed,

    result: mongoose.Schema.Types.Mixed,

    error: {
      code: String,
      message: String,
      details: mongoose.Schema.Types.Mixed
    },

    scheduledFor: Date,
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model("AgentTask", AgentTaskSchema);