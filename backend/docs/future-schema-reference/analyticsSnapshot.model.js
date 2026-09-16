import mongoose from "mongoose";

const AnalyticsSnapshotSchema = new mongoose.Schema(
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

    channel: {
      type: String,
      enum: [
        "instagram",
        "meta_ads",
        "google_ads",
        "email",
        "website",
        "crm"
      ],
      required: true
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign"
    },

    period: {
      start: Date,
      end: Date
    },

    metrics: {
      impressions: Number,
      reach: Number,
      engagement: Number,
      engagementRate: Number,
      clicks: Number,
      ctr: Number,
      leads: Number,
      mqls: Number,
      sqls: Number,
      opportunities: Number,
      conversions: Number,
      conversionRate: Number,
      spend: Number,
      revenue: Number,
      cpc: Number,
      cpl: Number,
      cpa: Number,
      roas: Number
    },

    source: String,
    fetchedAt: Date
  },
  {
    timestamps: true
  }
);

AnalyticsSnapshotSchema.index({
  organizationId: 1,
  channel: 1,
  "period.start": -1
});

export default mongoose.model(
  "AnalyticsSnapshot",
  AnalyticsSnapshotSchema
);