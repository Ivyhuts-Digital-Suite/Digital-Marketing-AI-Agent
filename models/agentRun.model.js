import mongoose from "mongoose";

const AgentRunSchema = new mongoose.Schema(
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

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTask"
    },

    parentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun"
    },

    agentType: {
      type: String,
      enum: [
        "orchestrator",
        "research",
        "strategy",
        "content",
        "campaign",
        "analytics",
        "optimization"
      ],
      required: true,
      index: true
    },

    model: {
      provider: String,
      name: String,
      version: String
    },

    request: String,
    context: mongoose.Schema.Types.Mixed,

    plan: [
      {
        stepNumber: Number,
        description: String,
        agentType: String,
        status: String
      }
    ],

    steps: [
      {
        stepNumber: Number,
        type: String,
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        status: String,
        startedAt: Date,
        completedAt: Date
      }
    ],

    toolCalls: [
      {
        toolName: String,
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        status: String,
        startedAt: Date,
        completedAt: Date,
        error: String
      }
    ],

    output: mongoose.Schema.Types.Mixed,

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

    error: {
      code: String,
      message: String,
      stack: String
    },

    usage: {
      inputTokens: Number,
      outputTokens: Number,
      totalTokens: Number
    },

    cost: {
      amount: Number,
      currency: String
    },

    durationMs: Number,
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

AgentRunSchema.index({
  organizationId: 1,
  agentType: 1,
  createdAt: -1
});

export default mongoose.model("AgentRun", AgentRunSchema);