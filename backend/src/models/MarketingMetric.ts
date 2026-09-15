import mongoose, { Document, Schema, Types } from "mongoose";
import { MarketingEventSource } from "./MarketingEvent";

/**
 * Phase 11 - Step 3: Canonical Marketing Metric Model.
 *
 * One normalized measurement for one period. Only the metric names the
 * spec explicitly lists are supported - the normalizer (see
 * services/analytics/normalization) never invents a metric name a
 * provider payload doesn't actually support.
 */
export type MarketingMetricName =
  | "impressions"
  | "reach"
  | "engagement"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "clicks"
  | "ctr"
  | "cpc"
  | "cpm"
  | "spend"
  | "conversions"
  | "conversionRate"
  | "leads"
  | "mqls"
  | "sqls"
  | "opportunities"
  | "customers"
  | "revenue";

const MARKETING_METRIC_NAMES: MarketingMetricName[] = [
  "impressions",
  "reach",
  "engagement",
  "likes",
  "comments",
  "shares",
  "saves",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "spend",
  "conversions",
  "conversionRate",
  "leads",
  "mqls",
  "sqls",
  "opportunities",
  "customers",
  "revenue",
];

const MARKETING_EVENT_SOURCES: MarketingEventSource[] = ["instagram", "meta_ads", "google_ads", "website", "email_crm"];

export interface IMarketingMetric extends Document {
  organizationId: Types.ObjectId;
  source: MarketingEventSource;
  integrationAccountId?: string;
  metric: MarketingMetricName;
  value: number;
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;

  channel?: string;
  campaignId?: Types.ObjectId;
  adId?: string;
  contentItemId?: Types.ObjectId;
  audienceId?: string;
  dimensions?: Record<string, unknown>;

  /** Dedupe key constructed by the normalizer, used for idempotent ingestion. */
  externalMetricId?: string;
}

const marketingMetricSchema = new Schema<IMarketingMetric>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    source: { type: String, enum: MARKETING_EVENT_SOURCES, required: true },
    integrationAccountId: { type: String },
    metric: { type: String, enum: MARKETING_METRIC_NAMES, required: true, index: true },
    value: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },

    channel: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    adId: { type: String },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", index: true },
    audienceId: { type: String },
    dimensions: { type: Schema.Types.Mixed, default: {} },

    externalMetricId: { type: String },
  },
  { timestamps: true }
);

marketingMetricSchema.index({ organizationId: 1, metric: 1, periodStart: -1 });
marketingMetricSchema.index({ organizationId: 1, contentItemId: 1, metric: 1, periodStart: -1 });
marketingMetricSchema.index(
  { organizationId: 1, externalMetricId: 1 },
  { unique: true, partialFilterExpression: { externalMetricId: { $type: "string" } } }
);

const MarketingMetric = mongoose.model<IMarketingMetric>("MarketingMetric", marketingMetricSchema);

export default MarketingMetric;
