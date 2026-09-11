import mongoose from "mongoose";

const MetricRecordSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },

    channel: String,

    entityType: {
      type: String,
      enum: [
        "account",
        "content",
        "campaign",
        "ad",
        "keyword",
        "email",
        "landing_page"
      ]
    },

    entityId: mongoose.Schema.Types.ObjectId,

    metric: {
      type: String,
      required: true,
      index: true
    },

    value: {
      type: Number,
      required: true
    },

    unit: String,
    recordedAt: {
      type: Date,
      required: true,
      index: true
    },

    source: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

MetricRecordSchema.index({
  organizationId: 1,
  entityType: 1,
  entityId: 1,
  metric: 1,
  recordedAt: -1
});

export default mongoose.model(
  "MetricRecord",
  MetricRecordSchema
);