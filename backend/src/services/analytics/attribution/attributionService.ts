import { Types } from "mongoose";
import AttributionTouchpoint, { IAttributionTouchpoint } from "../../../models/AttributionTouchpoint";
import MarketingEvent from "../../../models/MarketingEvent";
import { AnalyticsDatabaseError, InvalidAnalyticsInputError } from "../errors";

/**
 * Phase 11 - Step 16: Attribution.
 *
 * Builds a Content -> Campaign -> Lead -> Opportunity -> Revenue chain
 * strictly from real relationship IDs already present on MarketingEvent
 * documents for the SAME leadId (the only reliable join key available
 * without a real website-session/CRM integration). If the chain can't be
 * fully connected, chainComplete is false and the caller-facing result is
 * literally the string "Attribution unavailable" - never a guessed link.
 */
const UNAVAILABLE = "Attribution unavailable" as const;

function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

export type AttributionChainResult = IAttributionTouchpoint | typeof UNAVAILABLE;

/**
 * Attempts to build one attribution chain starting from a LEAD event for
 * the given contentItemId, following the SAME leadId forward through
 * later MQL/SQL/OPPORTUNITY/CUSTOMER/REVENUE events for this organization.
 */
export async function buildAttributionChain(organizationId: string, contentItemId: string): Promise<AttributionChainResult> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidAnalyticsInputError("contentItemId is missing or invalid");
  }

  let leadEvent;
  try {
    leadEvent = await MarketingEvent.findOne({
      organizationId,
      contentItemId,
      eventType: "LEAD",
      leadId: { $exists: true, $ne: null },
    }).sort({ timestamp: 1 });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load lead event: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!leadEvent || !leadEvent.leadId) {
    return UNAVAILABLE;
  }

  const downstream = await MarketingEvent.find({
    organizationId,
    leadId: leadEvent.leadId,
    eventType: { $in: ["OPPORTUNITY", "CUSTOMER", "REVENUE"] },
  }).sort({ timestamp: 1 });

  const opportunityEvent = downstream.find((e) => e.eventType === "OPPORTUNITY");
  const customerEvent = downstream.find((e) => e.eventType === "CUSTOMER");
  const revenueEvent = downstream.find((e) => e.eventType === "REVENUE");

  const chainComplete = Boolean(opportunityEvent && customerEvent && revenueEvent);

  try {
    return await AttributionTouchpoint.create({
      organizationId,
      contentItemId,
      campaignId: leadEvent.campaignId,
      leadId: leadEvent.leadId,
      contactId: opportunityEvent?.contactId ?? customerEvent?.contactId,
      opportunityId: opportunityEvent?.opportunityId,
      customerId: customerEvent?.customerId,
      revenueValue: revenueEvent?.value,
      chainComplete,
      establishedAt: new Date(),
    });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist attribution touchpoint: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getContentAttribution(organizationId: string, contentItemId: string): Promise<AttributionChainResult> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidAnalyticsInputError("contentItemId is missing or invalid");
  }

  const existing = await AttributionTouchpoint.findOne({ organizationId, contentItemId, chainComplete: true }).sort({ establishedAt: -1 });
  if (existing) return existing;

  return buildAttributionChain(organizationId, contentItemId);
}
