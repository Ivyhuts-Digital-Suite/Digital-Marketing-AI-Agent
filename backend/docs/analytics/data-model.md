# Phase 11 — Data Model

All models: `IMPLEMENTED`.

| Model | Purpose | Notes |
|---|---|---|
| `RawMetricSnapshot` | Raw provider payload, preserved indefinitely | One model for both raw metrics and raw events (`dataType: "metric" \| "event"`) rather than two near-identical schemas — the PDF's suggested `MetricSnapshot`/raw-event-layer, consolidated. Unique on `(organizationId, source, integrationAccountId, dataType, externalId)` for idempotent ingestion. |
| `MarketingEvent` | Canonical funnel event | `eventType` restricted to the 9 spec'd values. `leadId`/`contactId`/`opportunityId`/`customerId` are plain strings (external CRM identifiers, no CRM model exists). `contentItemId` is a real `ObjectId` ref into the existing Phase 7 `ContentItem` collection. |
| `MarketingMetric` | Canonical metric measurement | `metric` restricted to the 20 spec'd values. Unique on `(organizationId, externalMetricId)` for idempotency. |
| `AnalyticsFinding` | Deterministic engine output | Every numeric field traces to a real aggregation over `MarketingEvent`/`MarketingMetric`. `evidence[]` is the array `OptimizationRecommendation.hypotheses[].evidenceRefs` index into. |
| `AnalyticsReport` | Persisted LLM interpretation of one or more findings | Not in the PDF's literal name list under "Recommended Phase 11 models," but explicitly requested in Step 9 as the Analytics Agent's structured output; the PDF's own model list separately names `AnalyticsReport`. |
| `OptimizationRecommendation` | Optimization Agent output + approval/execution state machine | `status` is the exact 9-value enum from the spec. `hypotheses[].evidenceRefs` are validated in range before persistence (see `analytics-agent.md`/`optimization-agent.md`). |
| `OptimizationExecution` | One row per execution attempt | `result` is `"executed" \| "requires_phase10_integration" \| "failed"` — never silently "executed" when Phase 10 isn't available. |
| `Experiment` | A/B test definition | `control`/`variant` each optionally reference a real `ContentItem`. |
| `ExperimentResult` | Computed experiment outcome | `statisticallySignificant` is `boolean \| "insufficient_data"`. |
| `AttributionTouchpoint` | Content → revenue chain, when real IDs connect | `chainComplete: false` whenever any link is missing. |

## Deliberate consolidation vs. the PDF's literal list

The PDF lists `MetricSnapshot` as a separate recommended model. This implementation uses one `RawMetricSnapshot` model for both raw metrics and raw event-like payloads (distinguished by `dataType`), since at the raw-payload layer both are "an opaque provider record with an id and a timestamp" — the real structural difference only appears after normalization into `MarketingEvent`/`MarketingMetric`. This is a documented simplification, not an omission.
