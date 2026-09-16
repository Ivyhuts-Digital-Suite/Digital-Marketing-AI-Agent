import mongoose from "mongoose";

const MarketingGoalSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "brand_awareness",
        "engagement",
        "traffic",
        "lead_generation",
        "sales",
        "revenue",
        "retention",
        "customer_acquisition"
      ],
      required: true
    },

    description: String,
    targetMetric: String,
    targetValue: Number,
    currentValue: Number,
    unit: String,

    startDate: Date,
    targetDate: Date,

    priority: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["draft", "active", "achieved", "failed", "cancelled"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("MarketingGoal", MarketingGoalSchema);