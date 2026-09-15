import { MarketingEventSource, MarketingEventType } from "../../models/MarketingEvent";
import { MarketingMetricName } from "../../models/MarketingMetric";

/**
 * Shape a (future) Phase 10 integration layer's output would arrive in -
 * NOT a literal provider API response. AnalyticsIngestionService consumes
 * this; it never calls Meta/Google/Instagram/CRM APIs itself.
 */
export interface ProviderMetricPayload {
  source: MarketingEventSource;
  integrationAccountId?: string;
  /** Provider's own identifier for this raw record - the idempotency key. */
  externalId: string;
  retrievedAt: Date;
  /** Provider's own metric label, e.g. "reach", "cost", "MQL" - normalized by metricNormalizer.ts. */
  metric: string;
  value: number;
  periodStart: Date;
  periodEnd: Date;
  channel?: string;
  campaignId?: string;
  adId?: string;
  contentItemId?: string;
  audienceId?: string;
  dimensions?: Record<string, unknown>;
  /** The raw provider payload, preserved as-is in RawMetricSnapshot - never exposed to an agent. */
  raw: Record<string, unknown>;
}

export interface ProviderEventPayload {
  source: MarketingEventSource;
  integrationAccountId?: string;
  externalId: string;
  retrievedAt: Date;
  /** Provider's own event label, e.g. "like", "conversion" - normalized by eventNormalizer.ts. */
  eventType: string;
  timestamp: Date;
  campaignId?: string;
  contentItemId?: string;
  audienceId?: string;
  channel?: string;
  anonymousUserId?: string;
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
  customerId?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export interface NormalizedMetric {
  metric: MarketingMetricName;
  value: number;
}

export interface NormalizedEvent {
  eventType: MarketingEventType;
}

export interface TimeSeriesPoint {
  periodStart: Date;
  periodEnd: Date;
  value: number;
}

export interface IngestionSummary {
  metricsReceived: number;
  metricsIngested: number;
  metricsSkippedDuplicate: number;
  metricsNormalizationFailed: number;
  eventsReceived: number;
  eventsIngested: number;
  eventsSkippedDuplicate: number;
  eventsNormalizationFailed: number;
  errors: string[];
}
