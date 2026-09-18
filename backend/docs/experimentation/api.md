# Experimentation Engine — REST API

Base path: `/api/experimentation` (mounted in `server.ts` — see `architecture.md`'s "Mounting note" for the async-mount caveat).

Source: `backend/src/routes/experimentation.routes.js`, `backend/src/controllers/experimentation.controller.js`. Both are plain ESM `.js`, unlike the rest of `backend/src`. `organizationId` is read from `req.body` on every handler — there is no org-scoped auth middleware yet, so it must be supplied by the caller.

All 8 endpoints below are IMPLEMENTED. Everything they call is `ExperimentEngine.js` — no endpoint reaches `VariantGeneratorService`, `BusinessEvaluationService`, `MarketingMemoryService`, `StrategyHandoffService`, or `AutonomyPolicyService` (see `services.md`).

## `POST /api/experimentation/hypothesis`
Creates a Hypothesis (`status: "proposed"`).

**Body:**
```json
{
  "organizationId": "string (required)",
  "statement": "string (required)",
  "category": "string",
  "independentVariable": "string",
  "dependentMetric": "string",
  "targetAudience": "string",
  "channel": "string",
  "contentType": "string",
  "expectedDirection": "increase | decrease | no_change",
  "rationale": "string",
  "createdBy": "human | agent (default: human)",
  "sourceAgentType": "analytics | optimization | strategy",
  "confidence": "low | medium | high"
}
```
**Response:** `201` — the created Hypothesis document. `400` on Mongoose `ValidationError`. `500` otherwise.

## `POST /api/experimentation/`
Designs and creates an Experiment from a Hypothesis (`status: "designed"`).

**Body:**
```json
{
  "hypothesisId": "string (required)",
  "controlValue": "any (required, must differ from variantValue)",
  "variantValue": "any (required)",
  "durationDays": "number (default 14)",
  "minimumSampleSize": "number (default 1000)"
}
```
**Response:** `201` — the created Experiment document (`baseline.value` will be `null` until Phase 11 populates `MetricRecord`). `400` with `{error}` — e.g. `HYPOTHESIS_NOT_FOUND`, `INVALID_CONTROL_VARIANT: control and variant must both be provided and must differ`. `500` on unexpected errors.

## `GET /api/experimentation/:id`
Fetches an Experiment by id.

**Response:** `200` — the Experiment document. `404` — `{"error": "EXPERIMENT_NOT_FOUND"}`.

## `POST /api/experimentation/:id/approve`
Moves `designed` or `pending_approval` → `approved`. No body required.

**Response:** `200` — `{success: true, experiment}`. `400` — `{error: "Cannot approve experiment in status \"<status>\""}` if not in an approvable status.

## `POST /api/experimentation/:id/schedule`
Moves `approved` → `scheduled`.

**Body:**
```json
{ "startDate": "ISO date string", "endDate": "ISO date string" }
```
**Response:** `200` — `{success: true, experiment}`. `400` if not currently `approved`.

## `POST /api/experimentation/:id/start`
Moves `scheduled` or `approved` → `running`. No body required.

**Response:** `200` — `{success: true, experiment}`. `400` if not in a startable status.

## `POST /api/experimentation/:id/evaluate`
Runs the statistical test, persists two `ExperimentResult` documents (control + variant), creates an `AgentLearning`, and moves the Experiment to `completed` (VARIANT/CONTROL_SUPPORTED) or `inconclusive` (NO_CLEAR_DIFFERENCE) — or `invalid` if the input itself is statistically invalid.

**Body:**
```json
{
  "controlConversions": "number (required)",
  "controlSampleSize": "number (required, > 0)",
  "variantConversions": "number (required)",
  "variantSampleSize": "number (required, > 0)",
  "confidenceLevel": "0.9 | 0.95 | 0.99 (default 0.95)",
  "metricName": "string (default \"primary_metric\")"
}
```
**Response:** `200`:
```json
{
  "success": true,
  "statisticalResult": { "controlRate": 0, "variantRate": 0, "effectSize": 0, "relativeEffect": 0, "zScore": 0, "pValue": 0, "confidenceLevel": 0.95, "isSignificant": true, "confidenceInterval": { "lower": 0, "upper": 0 } },
  "resultState": "VARIANT_SUPPORTED | CONTROL_SUPPORTED | NO_CLEAR_DIFFERENCE | INCONCLUSIVE",
  "learning": { "...": "the created AgentLearning document" },
  "resultIds": ["controlExperimentResultId", "variantExperimentResultId"]
}
```
`400` with `{error}` on invalid stats input (`INVALID_SAMPLE_SIZE`, `ZERO_VARIANCE`) or `MISSING_EXPERIMENT_VARIANTS` if no `ExperimentVariant` documents of type `control`/`variant` exist for this experiment yet — **this is a hard prerequisite the caller must seed manually**, since no endpoint here creates `ExperimentVariant` documents (that's `VariantGeneratorService`, which isn't wired to any endpoint — see `services.md`).

## `POST /api/experimentation/:id/cancel`
Moves any non-terminal status → `cancelled`.

**Body:**
```json
{ "reason": "string (optional — accepted but not persisted anywhere on the document today)" }
```
**Response:** `200` — `{success: true, experiment}`. `400` — `{error: "Cannot cancel experiment already in terminal status \"<status>\""}`.

## Verified example

No live curl transcript from this session is available to include here — none was captured in the visible conversation history at the time this doc was written. The request/response shapes above come from direct code reading (`experimentation.controller.js`, `ExperimentEngine.js`, `StatisticalEvaluationService.js`), not from an observed HTTP exchange. If you have an actual curl transcript from testing this locally, paste it in and this section can be replaced with it.
