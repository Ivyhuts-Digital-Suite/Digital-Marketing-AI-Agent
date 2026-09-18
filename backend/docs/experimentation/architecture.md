# Experimentation Engine — Architecture

Internal engineering doc. Describes what actually exists in `backend/src/modules/experimentation/` and `backend/src/{controllers,routes}/experimentation.*` as of this writing, not the target design.

## Pipeline

The roadmap's intended flow is:

```
Hypothesis → ExperimentDesignService → VariantGeneratorService →
BaselineService / MeasurementService → StatisticalEvaluationService →
LearningService → MarketingMemoryService → StrategyHandoffService
```

Status of each stage, and — critically — whether `ExperimentEngine.js` (the only orchestrator actually called by the REST API) calls it automatically:

| Stage | File | Status | Called automatically by `ExperimentEngine.js`? |
|---|---|---|---|
| Hypothesis (human) | `ExperimentEngine.createHypothesis` | IMPLEMENTED | Yes — this *is* ExperimentEngine |
| Hypothesis (agent-sourced) | `HypothesisGeneratorService.generateHypothesisFromFinding` | IMPLEMENTED | **No** — standalone function, no live caller (would need Phase 11's Analytics/Optimization agents to pass in a `finding`, which don't exist yet) |
| Design | `ExperimentDesignService.designExperiment` | IMPLEMENTED | Yes — called inside `createExperiment` |
| Baseline | `BaselineService.calculateBaseline` | Query logic IMPLEMENTED; data path PLACEHOLDER | Yes — called inside `createExperiment`, but returns `source: "no_data_available"` because nothing writes `MetricRecord` yet (Phase 11) |
| Variant content generation | `VariantGeneratorService.generateVariantContent` | IMPLEMENTED | **No** — must be called directly; `ExperimentEngine.js` never imports it. There is no REST endpoint for it either. |
| Assignment strategy | `AssignmentService.determineAssignmentStrategy` / `validateCohortSize` | IMPLEMENTED (pure functions) | **No** — not called anywhere in `ExperimentEngine.js` |
| Measurement | `MeasurementService.measureExperimentArm` / `measureExperiment` | Query logic IMPLEMENTED; data path PLACEHOLDER | **No** — `evaluateExperiment` takes conversion/sample-size counts directly as caller-supplied params; it does not call this service to fetch them |
| Statistical evaluation | `StatisticalEvaluationService.calculateSignificance` / `determineResultState` | IMPLEMENTED | Yes — called inside `evaluateExperiment` |
| Learning | `LearningService.createLearningFromExperiment` | IMPLEMENTED | Yes — called inside `evaluateExperiment` |
| Business evaluation | `BusinessEvaluationService.evaluateBusinessImpact` | IMPLEMENTED (pure function) | **No** — not called anywhere in `ExperimentEngine.js` |
| Marketing memory | `MarketingMemoryService.findRelatedLearnings` / `assessEvidenceConsistency` | IMPLEMENTED | **No** — `evaluateExperiment` does not consult prior learnings before writing a new one |
| Strategy handoff | `StrategyHandoffService.proposeStrategyChangeFromLearning` | IMPLEMENTED | **No** — must be called manually per learning; also see `known-gaps.md` for a validation gap |
| Autonomy/risk classification | `AutonomyPolicyService.classifyExperimentRisk` | IMPLEMENTED (pure function) | **No** — `approveExperiment` does not call it; approval is unconditional human-only regardless of risk |

**Practical implication:** the only path exercised end-to-end by the live REST API today is `createHypothesis → createExperiment (→ BaselineService placeholder) → approve/schedule/start → evaluateExperiment (→ StatisticalEvaluationService → LearningService)`. Everything else in the table is real, working code, reachable only by importing and calling it directly (e.g. from a test or a future controller).

### Agent-layer entry point

`ExperimentationAgent.js` wraps `createHypothesis` / `createExperiment` / `evaluateExperiment` behind a `run({ action, params })` dispatcher and is registered in the agent registry (`registerAgents.js:16`). No orchestrator or route currently calls `agentRegistry.getByCapability(...)` for it — the only caller of `getByCapability` in the codebase is `AgentSelector.js`, and nothing routes an experimentation-shaped request through the orchestrator yet. So this entry point is IMPLEMENTED and registered, but **NOT WIRED** to anything reachable from outside the codebase.

## Experiment lifecycle states

Schema (`experiment.model.js`) defines: `draft, designed, pending_approval, approved, scheduled, running, measuring, evaluating, completed, cancelled, failed, invalid, inconclusive`.

Actual transitions produced by `ExperimentEngine.js`:

```
(createExperiment)      → designed
designed|pending_approval → approved         (approveExperiment)
approved                 → scheduled          (scheduleExperiment)
scheduled|approved        → running            (startExperiment)
running(assumed)          → completed | inconclusive   (evaluateExperiment, per resultState)
running(assumed)          → invalid            (evaluateExperiment, on invalid stats input)
any non-terminal          → cancelled          (cancelExperiment)
```

States that exist in the schema but are **never set by any code path today**: `draft` (the schema default, but `createExperiment` always creates directly into `designed`), `pending_approval` (only checked as an *accepted input* status in `approveExperiment`, nothing ever writes it), `measuring`, `evaluating` (explicitly called out as unmodeled in `ExperimentEngine.evaluateExperiment`'s own doc comment — there's no live analytics feed to make that intermediate state meaningful), and `failed` (only referenced in `cancelExperiment`'s terminal-status guard list, never assigned).

## Architecture rules actually being followed

- **Never forces a winner.** `StatisticalEvaluationService.determineResultState` returns `NO_CLEAR_DIFFERENCE` when the z-test isn't significant, rather than picking a side. Verified in code, not just comment.
- **LLM never does statistics.** `StatisticalEvaluationService.js` contains a hand-rolled two-proportion z-test and Abramowitz-Stegun normal CDF approximation — no model call anywhere in the file. `ExperimentEngine.evaluateExperiment` only ever passes the caller-supplied counts into this pure function.
- **Reuses Phase 11 instead of duplicating analytics.** `BaselineService` and `MeasurementService` both query the existing `MetricRecord` model rather than building new aggregation. Confirmed nothing else in the codebase writes to `MetricRecord` yet — that's the actual reason both return placeholder results (see `known-gaps.md`).
- **Never overwrites Strategy directly.** `StrategyHandoffService.proposeStrategyChangeFromLearning` only ever creates a `Recommendation` document; it never touches `Strategy`/`StrategyVersion` collections. Whether a recommendation becomes a real strategy change is left entirely to the Strategy module's own approval flow.
- **Content variants reuse the real Content Studio, not a parallel system.** `VariantGeneratorService.generateVariantContent` creates a real `Content` + `CreativeBrief` document via the same `TextEngine.generateText` used elsewhere, and creates it with `status: "draft"`. It does not call any publish path — whatever approval/publishing gate exists elsewhere in the app for turning draft `Content` into live posts is untouched and still applies. (Note: this codebase doesn't label that gate "Phase 9" or "Phase 10" anywhere in source; that framing wasn't found in comments, so it isn't cited here as a verified fact — only the underlying "drafts only, no bypass" behavior is.)

## Mounting note

`experimentation.routes.js` is plain ESM `.js`, while the rest of `backend/src` is TypeScript/CommonJS. `server.ts` loads it via a dynamic `import()` that resolves *after* `app.listen()` is already scheduled (`server.ts:37-43`) — so there is a brief window right after process start where `/api/experimentation/*` can 404 before the async mount completes. This is a real, observable characteristic of the current wiring, not a hypothetical.
