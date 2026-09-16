# Future schema reference (not part of the build)

These 28 files are Mongoose schema **sketches**, not source code. They are
plain `.js` and are **not** imported by anything, **not** compiled by
`tsc` (there is no `allowJs` in `backend/tsconfig.json`), and **not**
executed at runtime. They were moved out of `backend/src` on 2026-09-13 so that `backend/src`
is unambiguously the single source of truth for what's actually running.

## Where they came from

They're the surviving portion of an early, disconnected "AI agent
framework" prototype (`src/modules/ai/**` in the git history) that was
never wired into `src/server.ts`. The rest of that framework — the
orchestrator, the agent/tool/model registries, the Instagram content
pipeline, brand validation, etc. — has since been properly superseded by
the live TypeScript implementation (`src/services/contentStudio/**`,
`src/services/companyIntelligence/**`, `src/services/contentIntelligence/**`)
and was deleted outright, since every piece of its functionality already
has a working, tested TypeScript equivalent.

These 28 model files were kept instead of deleted because they describe
product surface that has **no TypeScript equivalent yet** — they aren't
duplicates of anything live, they're sketches of things not yet built:

- `organization.model.js` / `organizationMembership.model.js` - a real
  Organization/membership model. This is a known, repeatedly-noted gap in
  the live backend (every endpoint currently takes a bare `organizationId`
  string on trust - see the comments in `contentIntelligence.controller.ts`
  and `contentStudio/contentResolver.service.ts`). Whoever builds that
  system should treat this file as a rough starting sketch, not a
  finished design - re-review and redesign it properly rather than
  wiring it in as-is.
- `marketingStrategy.model.js`, `campaign.model.js`, `campaignAsset.model.js`,
  `persona.model.js`, `marketingGoal.model.js`, `competitor.model.js`,
  `keyword.model.js`, `researchReport.model.js`, `researchSource.model.js`,
  `contentCalendar.model.js`, `company.model.js` - richer/alternate takes
  on concepts that already have a simpler, live TypeScript model or
  service covering the current feature set (e.g. `strategy.schema.ts`,
  `ContentPlan.ts`/`ContentItem.ts`, `research.schema.ts`). Not
  duplicates to merge - reference for when those areas grow beyond what's
  built today.
- `agentTask.model.js`, `agentRun.model.js`, `agentMemory.model.js`,
  `agentLearning.model.js`, `recommendation.model.js`, `experiment.model.js`,
  `experimentVariant.model.js`, `experimentResult.model.js`,
  `analyticsSnapshot.model.js`, `metricRecord.model.js`, `approval.model.js`,
  `integration.model.js`, `integrationAccount.model.js`,
  `integrationSync.model.js`, `auditLog.model.js` - schemas for
  optimization/analytics/integrations/approval-workflow features that
  don't exist in the product yet at all.

## What NOT to do with these

- Don't import them from `backend/src` as-is - some were written against
  an abandoned architecture (e.g. referencing a `Company` model, or an
  `AgentRun` model, that no longer match the live schema conventions).
- Don't assume they're correct or complete. They were never reviewed
  against real requirements - treat every field as a hypothesis.
- If a feature described here actually gets built, design its TypeScript
  model against the current live conventions (see any file in
  `backend/src/models/*.ts`) using this only as a rough idea starting
  point, then delete the corresponding file from this folder.
