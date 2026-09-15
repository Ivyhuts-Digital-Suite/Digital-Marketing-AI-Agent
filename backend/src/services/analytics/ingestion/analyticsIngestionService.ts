import { Types } from "mongoose";
import MarketingEvent from "../../../models/MarketingEvent";
import MarketingMetric from "../../../models/MarketingMetric";
import RawMetricSnapshot from "../../../models/RawMetricSnapshot";
import { InvalidAnalyticsInputError, AnalyticsDatabaseError } from "../errors";
import { normalizeEventType } from "../normalization/eventNormalizer";
import { normalizeMetricName } from "../normalization/metricNormalizer";
import { IngestionSummary, ProviderEventPayload, ProviderMetricPayload } from "../types";

/**
 * Phase 11 - Step 1/5: Analytics Ingestion Service.
 *
 * Consumes ProviderMetricPayload/ProviderEventPayload - the shape a
 * (future) Phase 10 integration layer would hand over. This service never
 * calls Meta/Google/Instagram/CRM APIs itself.
 *
 * Pipeline per item: raw snapshot (idempotent upsert, keyed by the
 * provider's own externalId) -> normalization -> canonical storage
 * (idempotent upsert, keyed by a derived externalMetricId/externalEventId).
 * Re-ingesting the same provider record is always a safe no-op.
 */

function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

function buildMetricExternalId(payload: ProviderMetricPayload): string {
  return `${payload.source}:${payload.integrationAccountId ?? "default"}:${payload.externalId}`;
}

function buildEventExternalId(payload: ProviderEventPayload): string {
  return `${payload.source}:${payload.integrationAccountId ?? "default"}:${payload.externalId}`;
}

async function ingestOneMetric(
  organizationId: string,
  payload: ProviderMetricPayload,
  summary: IngestionSummary
): Promise<void> {
  summary.metricsReceived++;

  try {
    const existingRaw = await RawMetricSnapshot.findOne({
      organizationId,
      source: payload.source,
      integrationAccountId: payload.integrationAccountId,
      dataType: "metric",
      externalId: payload.externalId,
    });

    if (existingRaw?.normalized) {
      summary.metricsSkippedDuplicate++;
      return;
    }

    if (!existingRaw) {
      await RawMetricSnapshot.create({
        organizationId,
        source: payload.source,
        integrationAccountId: payload.integrationAccountId,
        dataType: "metric",
        externalId: payload.externalId,
        retrievedAt: payload.retrievedAt,
        payload: payload.raw,
        normalized: false,
      });
    }

    const { metric, error } = normalizeMetricName(payload.source, payload.metric);
    if (!metric) {
      summary.metricsNormalizationFailed++;
      summary.errors.push(error ?? "unknown metric normalization error");
      await RawMetricSnapshot.updateOne(
        { organizationId, source: payload.source, integrationAccountId: payload.integrationAccountId, dataType: "metric", externalId: payload.externalId },
        { $set: { normalizationError: error } }
      );
      return;
    }

    const externalMetricId = buildMetricExternalId(payload);

    await MarketingMetric.updateOne(
      { organizationId, externalMetricId },
      {
        $setOnInsert: {
          organizationId,
          source: payload.source,
          integrationAccountId: payload.integrationAccountId,
          metric,
          value: payload.value,
          timestamp: payload.retrievedAt,
          periodStart: payload.periodStart,
          periodEnd: payload.periodEnd,
          channel: payload.channel,
          campaignId: payload.campaignId,
          adId: payload.adId,
          contentItemId: payload.contentItemId,
          audienceId: payload.audienceId,
          dimensions: payload.dimensions ?? {},
          externalMetricId,
        },
      },
      { upsert: true }
    );

    await RawMetricSnapshot.updateOne(
      { organizationId, source: payload.source, integrationAccountId: payload.integrationAccountId, dataType: "metric", externalId: payload.externalId },
      { $set: { normalized: true }, $unset: { normalizationError: "" } }
    );

    summary.metricsIngested++;
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : String(error));
  }
}

async function ingestOneEvent(
  organizationId: string,
  payload: ProviderEventPayload,
  summary: IngestionSummary
): Promise<void> {
  summary.eventsReceived++;

  try {
    const existingRaw = await RawMetricSnapshot.findOne({
      organizationId,
      source: payload.source,
      integrationAccountId: payload.integrationAccountId,
      dataType: "event",
      externalId: payload.externalId,
    });

    if (existingRaw?.normalized) {
      summary.eventsSkippedDuplicate++;
      return;
    }

    if (!existingRaw) {
      await RawMetricSnapshot.create({
        organizationId,
        source: payload.source,
        integrationAccountId: payload.integrationAccountId,
        dataType: "event",
        externalId: payload.externalId,
        retrievedAt: payload.retrievedAt,
        payload: payload.raw,
        normalized: false,
      });
    }

    const { eventType, error } = normalizeEventType(payload.source, payload.eventType);
    if (!eventType) {
      summary.eventsNormalizationFailed++;
      summary.errors.push(error ?? "unknown event normalization error");
      await RawMetricSnapshot.updateOne(
        { organizationId, source: payload.source, integrationAccountId: payload.integrationAccountId, dataType: "event", externalId: payload.externalId },
        { $set: { normalizationError: error } }
      );
      return;
    }

    const externalEventId = buildEventExternalId(payload);

    await MarketingEvent.updateOne(
      { organizationId, source: payload.source, sourceAccountId: payload.integrationAccountId ?? "default", externalEventId },
      {
        $setOnInsert: {
          organizationId,
          source: payload.source,
          sourceAccountId: payload.integrationAccountId ?? "default",
          eventType,
          timestamp: payload.timestamp,
          campaignId: payload.campaignId,
          contentItemId: payload.contentItemId,
          audienceId: payload.audienceId,
          channel: payload.channel,
          anonymousUserId: payload.anonymousUserId,
          leadId: payload.leadId,
          contactId: payload.contactId,
          opportunityId: payload.opportunityId,
          customerId: payload.customerId,
          value: payload.value,
          metadata: payload.metadata ?? {},
          externalEventId,
        },
      },
      { upsert: true }
    );

    await RawMetricSnapshot.updateOne(
      { organizationId, source: payload.source, integrationAccountId: payload.integrationAccountId, dataType: "event", externalId: payload.externalId },
      { $set: { normalized: true }, $unset: { normalizationError: "" } }
    );

    summary.eventsIngested++;
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Ingests a batch of provider metric/event payloads for one organization.
 * Safe to call repeatedly with overlapping data - idempotent on each
 * payload's externalId.
 */
export async function ingestProviderData(
  organizationId: string,
  metrics: ProviderMetricPayload[],
  events: ProviderEventPayload[]
): Promise<IngestionSummary> {
  assertValidOrganizationId(organizationId);

  const summary: IngestionSummary = {
    metricsReceived: 0,
    metricsIngested: 0,
    metricsSkippedDuplicate: 0,
    metricsNormalizationFailed: 0,
    eventsReceived: 0,
    eventsIngested: 0,
    eventsSkippedDuplicate: 0,
    eventsNormalizationFailed: 0,
    errors: [],
  };

  try {
    for (const metric of metrics) {
      await ingestOneMetric(organizationId, metric, summary);
    }
    for (const event of events) {
      await ingestOneEvent(organizationId, event, summary);
    }
  } catch (error) {
    throw new AnalyticsDatabaseError(`ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return summary;
}
