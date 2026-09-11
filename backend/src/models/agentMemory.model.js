import mongoose from "mongoose";

const AgentMemorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    agentType: String,

    memoryType: {
      type: String,
      enum: [
        "fact",
        "preference",
        "decision",
        "pattern",
        "constraint",
        "learning"
      ]
    },

    key: String,

    content: {
      type: String,
      required: true
    },

    confidence: Number,
    sourceType: String,
    sourceId: mongoose.Schema.Types.ObjectId,
    expiresAt: Date,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

AgentMemorySchema.index({
  organizationId: 1,
  agentType: 1,
  isActive: 1
});

export default mongoose.model("AgentMemory", AgentMemorySchema);