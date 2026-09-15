import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 2: Canonical Marketing Event Model.
 *
 * A single normalized event in the funnel language every agent shares,
 * regardless of which platform produced it. leadId/contactId/opportunityId/
 * customerId are plain strings (not ObjectId refs) because they identify
 * records in an external CRM, not a document in this database - no CRM
 * model exists in this codebase. campaignId/audienceId are similarly plain
 * until real Campaign/Audience models exist; contentItemId is a real
 * ObjectId ref because ContentItem already exists (Phase 7).
 */
export type MarketingEventSource = "instagram" | "meta_ads" | "google_ads" | "website" | "email_crm";

export type MarketingEventType =
  | "IMPRESSION"
  | "ENGAGEMENT"
  | "CLICK"
  | "LEAD"
  | "MQL"
  | "SQL"
  | "OPPORTUNITY"
  | "CUSTOMER"
  | "REVENUE";

const MARKETING_EVENT_SOURCES: MarketingEventSource[] = ["instagram", "meta_ads", "google_ads", "website", "email_crm"];
const MARKETING_EVENT_TYPES: MarketingEventType[] = [
  "IMPRESSION",
  "ENGAGEMENT",
  "CLICK",
  "LEAD",
  "MQL",
  "SQL",
  "OPPORTUNITY",
  "CUSTOMER",
  "REVENUE",
];

export interface IMarketingEvent extends Document {
  organizationId: Types.ObjectId;
  source: MarketingEventSource;
  /** External integration account identifier - plain string, no IntegrationAccount model exists yet. */
  sourceAccountId: string;
  eventType: MarketingEventType;
  timestamp: Date;

  campaignId?: Types.ObjectId;
  contentItemId?: Types.ObjectId;
  audienceId?: string;
  channel?: string;

  anonymousUserId?: string;
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
  customerId?: string;

  value?: number;
  metadata?: Record<string, unknown>;

  /** Provider's own identifier for this event, used for idempotent ingestion. Optional so hand-authored/derived events don't need one. */
  externalEventId?: string;
}

const marketingEventSchema = new Schema<IMarketingEvent>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    source: { type: String, enum: MARKETING_EVENT_SOURCES, required: true },
    sourceAccountId: { type: String, required: true },
    eventType: { type: String, enum: MARKETING_EVENT_TYPES, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", index: true },
    audienceId: { type: String },
    channel: { type: String },

    anonymousUserId: { type: String },
    leadId: { type: String, index: true },
    contactId: { type: String },
    opportunityId: { type: String, index: true },
    customerId: { type: String, index: true },

    value: { type: Number },
    metadata: { type: Schema.Types.Mixed, default: {} },

    externalEventId: { type: String },
  },
  { timestamps: true }
);

marketingEventSchema.index({ organizationId: 1, eventType: 1, timestamp: -1 });
marketingEventSchema.index(
  { organizationId: 1, source: 1, sourceAccountId: 1, externalEventId: 1 },
  { unique: true, partialFilterExpression: { externalEventId: { $type: "string" } } }
);

const MarketingEvent = mongoose.model<IMarketingEvent>("MarketingEvent", marketingEventSchema);

export default MarketingEvent;
