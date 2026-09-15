# Phase 11 — Experimentation

Status: `IMPLEMENTED`.

## Lifecycle

`Experiment.status`: `draft → running → completed` (or `aborted`), managed by `services/analytics/experimentation/experimentService.ts`.

## Significance testing

`computeExperimentResult` runs a real two-proportion z-test (Abramowitz & Stegun error-function approximation for the p-value — a real statistical computation, not an LLM judgment; rule #18 is explicit that arithmetic/statistics must not go through Claude) comparing control vs. variant totals for the chosen metric over the experiment's date range, pulled from real `MarketingMetric` data for each arm's `contentItemId`.

`statisticallySignificant` is the literal string `"insufficient_data"` — never a guessed `true`/`false` — whenever either arm's sample size is below 30. Verified by an automated test using a deliberately tiny fixture sample.

## Known limitation

Only `contentItemId`-scoped experiments are supported today (an arm without a linked `ContentItem` cannot be measured) — sufficient for the PDF's own worked example (hook A/B test on two Reels), but campaign-level or audience-level experiment arms are `NOT YET IMPLEMENTED`.
