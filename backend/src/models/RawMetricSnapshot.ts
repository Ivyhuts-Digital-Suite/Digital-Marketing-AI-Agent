import mongoose, { Document, Schema, Types } from "mongoose";
import { MarketingEventSource } from "./MarketingEvent";

/**
 * Phase 11 - Step 1/11.2: Raw provider data layer.
 *
 * One row per raw record retrieved from a provider (via the Phase 10
 * integration layer's output - never called directly from here), before
 * normalization. Kept indefinitely so normalization logic can be
 * reprocessed later without re-fetching from the provider, and so a
 * provider's exact payload/definitions at retrieval time aren't lost.
 *
 * Deliberately one model for both raw events and raw metrics
 * (distinguished by `dataType`) rather than two near-identical schemas -
 * both are "an opaque provider payload with an id and a timestamp" at
 * this layer; the real structural difference only appears after
 * normalization into MarketingEvent/MarketingMetric.
 */
export type RawDataType = "metric" | "event";

const MARKETING_EVENT_SOURCES: MarketingEventSource[] = ["instagram", "meta_ads", "google_ads", "website", "email_crm"];

export interface IRawMetricSnapshot extends Document {
  organizationId: Types.ObjectId;
  source: MarketingEventSource;
  integrationAccountId?: string;
  dataType: RawDataType;
  /** Provider's own identifier for this raw record - the idempotency key. */
  externalId: string;
  retrievedAt: Date;
  /** Opaque - never exposed directly to an agent. Only the normalizer reads this. */
  payload: Record<string, unknown>;
  normalized: boolean;
  normalizationError?: string;
}

const rawMetricSnapshotSchema = new Schema<IRawMetricSnapshot>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    source: { type: String, enum: MARKETING_EVENT_SOURCES, required: true },
    integrationAccountId: { type: String },
    dataType: { type: String, enum: ["metric", "event"], required: true },
    externalId: { type: String, required: true },
    retrievedAt: { type: Date, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    normalized: { type: Boolean, default: false, index: true },
    normalizationError: { type: String },
  },
  { timestamps: true }
);

rawMetricSnapshotSchema.index(
  { organizationId: 1, source: 1, integrationAccountId: 1, dataType: 1, externalId: 1 },
  { unique: true }
);

const RawMetricSnapshot = mongoose.model<IRawMetricSnapshot>("RawMetricSnapshot", rawMetricSnapshotSchema);

export default RawMetricSnapshot;
