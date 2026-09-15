# Phase 11 — Analytics + Optimization Engine: Architecture

## Status labels used throughout these docs
`IMPLEMENTED` | `MOCKED FOR TESTING` | `REQUIRES PHASE 10 INTEGRATION` | `REQUIRES EXTERNAL DATA` | `NOT YET IMPLEMENTED`

## The loop this phase implements

```
Phase 10 integration output (REQUIRES PHASE 10 INTEGRATION - does not exist in this codebase)
  -> AnalyticsIngestionService (IMPLEMENTED)
  -> RawMetricSnapshot (IMPLEMENTED)
  -> Normalizer (IMPLEMENTED)
  -> MarketingEvent / MarketingMetric (IMPLEMENTED)
  -> Analytics Engine: baseline/anomaly/trend/funnel/comparison (IMPLEMENTED, deterministic)
  -> AnalyticsFinding (IMPLEMENTED)
  -> Analytics Agent (LLM interpretation) -> AnalyticsReport (IMPLEMENTED)
  -> Optimization Agent (LLM diagnosis/hypotheses) -> OptimizationRecommendation (IMPLEMENTED)
  -> Human approval (IMPLEMENTED - mandatory, no bypass path exists)
  -> Execution via MarketingIntegrationProvider (REQUIRES PHASE 10 INTEGRATION - adapter exists, only implementation honestly reports "not available")
  -> Measurement (IMPLEMENTED, but only runs after a real "executed" outcome, which needs Phase 10)
  -> Strategy feedback adapter (REQUIRES PHASE 6 STRATEGY AGENT - adapter exists, only implementation is a no-op)
```

## Why this branch's reality shaped the design

As of branch `janavi-analytics-optimization`, this codebase has:
- **No Phase 9 approval system** and **no Phase 10 integration/tool layer** anywhere.
- **No AIService/LLMProvider/ClaudeProvider abstraction** — the established convention (used by Company Intelligence and Content Intelligence already) is a small per-module OpenAI wrapper. Phase 11's Analytics Agent and Optimization Agent follow that same convention rather than introducing a new shared abstraction with no other caller.
- **No Organization/membership model** — `authenticate` proves a valid user, not org membership (see `security.md`).
- **No Strategy Agent or Research Agent** merged into this branch's architecture (they exist, unmerged, on `origin/preetam-strategy-agent`/`origin/preetam-research-agent`, in a different module layout entirely).

Every place Phase 11 would need one of these missing systems, it defines a clean adapter interface with exactly one implementation today — one that is honest about not having the real thing, never one that fakes it:

| Seam | Interface | Current implementation |
|---|---|---|
| Phase 10 execution | `MarketingIntegrationProvider` (`adapters/marketingIntegrationAdapter.ts`) | `NullMarketingIntegrationProvider` — reports every tool as unavailable |
| Strategy feedback | `StrategyFeedbackAdapter` (`adapters/strategyFeedbackAdapter.ts`) | `NullStrategyFeedbackAdapter` — logs, never mutates Strategy |
| Human approval | State machine directly on `OptimizationRecommendation` | Fully implemented locally; a future shared Phase 9 service can front it later without changing the status semantics |

## Module layout

```
backend/src/models/                       - 10 new Mongoose models (see data-model.md)
backend/src/services/analytics/
  types.ts, errors.ts                     - shared internal types + typed error classes
  adapters/                               - Phase 10 / Strategy seams (see above)
  ingestion/analyticsIngestionService.ts  - Step 1
  normalization/                          - Step 4
  engine/                                 - Steps 6-8 (deterministic)
  funnel/funnelAnalysisService.ts         - Step 5
  agents/                                 - Step 9 (Analytics Agent)
  optimization/                           - Steps 10-13 (Optimization Agent, approval, execution)
  measurement/measurementService.ts       - Step 14
  experimentation/experimentService.ts    - Step 15
  attribution/attributionService.ts       - Step 16
  feedback/feedbackService.ts             - Step 17
  analyticsService.ts, optimizationService.ts - top-level facades (Step 18)
backend/src/controllers/, routes/         - /api/analytics/*, /api/optimization/*
```

No existing Company Intelligence, Content Intelligence, auth, Document Processing, Chunking, Embedding, or Vector Search code was modified beyond two additive lines in `server.ts` registering the new routes.
