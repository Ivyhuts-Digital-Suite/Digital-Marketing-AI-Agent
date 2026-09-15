# Phase 11 — Optimization Agent & Recommendation Lifecycle

Status: `IMPLEMENTED` for diagnosis/hypothesis generation, the full approval state machine, and measurement machinery. `REQUIRES PHASE 10 INTEGRATION` for actual execution (see below).

## Diagnosis and hypothesis generation (Steps 10/11)

`services/analytics/optimization/optimizationAgentLlm.ts` gives the model a finding plus its **numbered** evidence list and requires every hypothesis to cite `evidenceRefs` — indexes into that list. This is not just a prompt instruction: `optimizationRecommendationService.ts` re-validates every ref is actually in range **after** the LLM responds, drops any hypothesis whose refs are all out of range, and — if every hypothesis for a finding turns out ungrounded — refuses to persist the recommendation at all rather than saving one with no real hypotheses. Verified by two automated tests (partial grounding kept, full ungrounding rejected).

## The recommendation state machine (Step 11/12)

`OptimizationRecommendation.status` is the exact 9-value enum from the spec: `GENERATED → REVIEW → APPROVED/REJECTED → EXECUTING → EXECUTED → MEASURING → COMPLETED`, plus `FAILED`. `services/analytics/optimization/approvalService.ts` is the **only** code path that can move a recommendation to `APPROVED`/`REJECTED`, and it only accepts that transition from `GENERATED`/`REVIEW` — verified by tests for both the happy path and the double-approval rejection.

**There is no code path anywhere in this codebase that lets a recommendation reach `EXECUTING`/`EXECUTED` without first passing through `approvalService.ts`.** This is the literal implementation of rule #11 ("never let the Optimization Agent directly execute its own recommendation").

A generalized cross-feature Phase 9 approval/audit system does not exist in this repo yet, so this state machine lives directly on `OptimizationRecommendation` — intentionally self-contained so a future shared Phase 9 service could front it later without changing the status semantics any consumer relies on.

## Execution (Step 13) — `REQUIRES PHASE 10 INTEGRATION`

`services/analytics/optimization/executionService.ts` only accepts an `APPROVED` recommendation, then calls `marketingIntegrationProvider.executeTool(...)` (`adapters/marketingIntegrationAdapter.ts`) — never a direct Meta/Google/CRM call. The only implementation of that adapter today, `NullMarketingIntegrationProvider`, honestly reports every tool as unavailable. The recommendation's status is only ever advanced to `EXECUTED` when the adapter reports real success; otherwise it stays `APPROVED` and a `requires_phase10_integration` `OptimizationExecution` row is persisted. Verified by an automated test that this never silently reports success.
