import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 16: AttributionTouchpoint.
 *
 * Persisted only when a real chain of relationship IDs actually connects
 * these entities via MarketingEvent records - see
 * services/analytics/attribution/attributionService.ts. chainComplete is
 * false whenever the chain breaks anywhere between content and revenue;
 * nothing here is ever inferred or guessed to complete a broken chain.
 */
export interface IAttributionTouchpoint extends Document {
  organizationId: Types.ObjectId;
  contentItemId?: Types.ObjectId;
  campaignId?: Types.ObjectId;
  trackingUrl?: string;
  websiteSessionId?: string;
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
  customerId?: string;
  revenueValue?: number;
  chainComplete: boolean;
  establishedAt: Date;
}

const attributionTouchpointSchema = new Schema<IAttributionTouchpoint>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    trackingUrl: { type: String },
    websiteSessionId: { type: String },
    leadId: { type: String },
    contactId: { type: String },
    opportunityId: { type: String },
    customerId: { type: String },
    revenueValue: { type: Number },
    chainComplete: { type: Boolean, required: true, default: false },
    establishedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

attributionTouchpointSchema.index({ organizationId: 1, contentItemId: 1 });

const AttributionTouchpoint = mongoose.model<IAttributionTouchpoint>("AttributionTouchpoint", attributionTouchpointSchema);

export default AttributionTouchpoint;
