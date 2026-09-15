# Phase 11 — Security / Multi-Tenancy

## What IS enforced (`IMPLEMENTED`)

Every read and write in `services/analytics/**` takes `organizationId` as an explicit parameter and includes it in every Mongoose query/filter — there is no code path that reads or writes `MarketingEvent`/`MarketingMetric`/`AnalyticsFinding`/`OptimizationRecommendation`/etc. without an `organizationId` filter. This was verified directly in the automated test suite (a stubbed query that received the wrong `organizationId` throws).

`organizationId` is validated as a well-formed ObjectId at every service boundary before use (`InvalidAnalyticsInputError` otherwise).

## What is NOT yet enforced (`REQUIRES ORGANIZATION MEMBERSHIP INTEGRATION`)

This repository has **no Organization or membership model anywhere** — `User` has no `organizationId` field, and no join table between users and organizations exists. This is a pre-existing gap already documented identically on `companyIntelligence.controller.ts` and `contentIntelligence.controller.ts`, not something introduced by Phase 11.

Concretely: `authenticate` (JWT middleware) proves the caller is *a* valid logged-in user. It does **not** prove that user belongs to the `:orgId` in the URL/body. So today:
- ✅ Org A's data can never leak into a query scoped to Org B (every query filters by the org ID actually supplied).
- ❌ A valid, authenticated user from any organization can currently supply *any* `organizationId` and read/act on that organization's analytics/optimization data via these endpoints.

Per the spec's own instruction ("do not invent a large unrelated auth redesign... implement the cleanest compatible authorization boundary, clearly document what is currently enforced, clearly mark what requires existing Organization membership integration"), this gap is not patched here with an ad hoc mechanism. **The fix is a real Organization/membership model plus a middleware that checks `req.user` against it — once that exists, it should be added to `analytics.routes.ts` and `optimization.routes.ts` the same way `authenticate` is applied today, with no changes needed inside the service layer itself** (which already only trusts the `organizationId` it's explicitly given).

## Integration account ownership

Not applicable yet: no `IntegrationAccount` model or Phase 10 exists in this codebase, so there is nothing to validate ownership of yet. `sourceAccountId`/`integrationAccountId` are stored as plain strings on `MarketingEvent`/`MarketingMetric`/`RawMetricSnapshot`, ready for a real ownership check once Phase 10 exists.
