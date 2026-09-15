# Phase 11 — Anomaly & Trend Detection

Status: `IMPLEMENTED` (fully deterministic — no LLM call anywhere in this file).

## Anomaly detection (`engine/anomalyDetectionService.ts`)

Given a current value and historical values for the same entity/metric:
1. If fewer than 3 historical samples exist, `hasSufficientData: false` and `isAnomaly: false` — never guessed from too little history.
2. Otherwise, computes `average ± 1.5×stdDev` as the expected range (`engine/baselineService.ts`).
3. Flags an anomaly when the current value falls outside that range, and reports `direction: "above" | "below"`.

Matches the PDF's own worked example exactly (historical average 18,200; current 7,900 → anomaly, direction "below") — covered by an automated test.

## Trend detection (`engine/trendDetectionService.ts`)

Classifies a time series (≥3 points) as:
- `sustained_positive` / `sustained_negative` — monotonic across the whole series AND total change ≥10%
- `volatile` — coefficient of variation > 0.3
- `stable` — none of the above
- `insufficient_data` — fewer than 3 points

## What is NOT implemented

**Seasonal change detection**: `NOT YET IMPLEMENTED`. Classifying a change as "seasonal" honestly requires multiple comparable historical cycles (e.g. year-over-year), which this system cannot assume exist yet. Rather than guess, seasonal patterns currently surface as `volatile` or `sustained_*` depending on their shape — a known limitation, not a silent gap.

## How a finding gets produced

`engine/analyticsEngineService.ts` orchestrates four independent scans, each producing real `AnalyticsFinding` documents from real aggregated data:
- `scanEntityAnomaliesAndTrends` — per-entity ANOMALY/TREND (baseline-relative)
- `scanPeerPerformance` — UNDERPERFORMANCE/HIGH_PERFORMANCE (peer-relative, requires ≥3 entities)
- `scanConversionProblems` — funnel-stage conversion-rate drops between two periods
- `scanAudienceChanges` — audience-share shifts between two periods

Every finding's `confidence` is a deterministic function of sample size, never of deviation magnitude (severity already captures magnitude) and never LLM-assigned.
