# Phase 11 — Normalization

Status: `IMPLEMENTED` for the mapping logic and pipeline; `REQUIRES PHASE 10 INTEGRATION` for real provider payloads to normalize (today it only ever sees test/fixture `ProviderMetricPayload`/`ProviderEventPayload` objects).

## How it works

`services/analytics/normalization/metricNormalizer.ts` and `eventNormalizer.ts` are lookup tables per source (`instagram`, `meta_ads`, `google_ads`, `website`, `email_crm`), each mapping a provider's own label onto the canonical `MarketingMetricName`/`MarketingEventType` vocabulary. An unrecognized label is **always** an explicit normalization error — never a guessed mapping. This is what "do not invent unsupported metrics" means in code (rule #6).

`services/analytics/ingestion/analyticsIngestionService.ts` wires this into a full pipeline per item:

```
ProviderMetricPayload/ProviderEventPayload
  -> RawMetricSnapshot (idempotent upsert, keyed by the provider's own externalId)
  -> normalizeMetricName / normalizeEventType
  -> MarketingMetric/MarketingEvent (idempotent upsert, keyed by a derived externalMetricId/externalEventId)
```

Re-ingesting the same provider record is always a safe no-op — verified in the Phase 11 test suite.

## Deliberately unmapped cases

- **Google Ads "conversion value"** — a platform-estimated ad value, not CRM-confirmed revenue. Mapping it to canonical `"revenue"` would quietly pollute revenue/ROI calculations with an unconfirmed number, so it is left unsupported (returns a normalization error) until a real product need justifies a distinct canonical metric for it.
- **Ad-platform "conversion" events** — ambiguous (could be a LEAD, OPPORTUNITY, or CUSTOMER depending on how the advertiser configured the conversion action). Left unmapped; the caller must supply the already-disambiguated canonical `eventType` for these.

## Extending to a new provider

Add one more entry to the relevant `..._METRIC_MAP`/`..._EVENT_MAP` object. No other file changes.
