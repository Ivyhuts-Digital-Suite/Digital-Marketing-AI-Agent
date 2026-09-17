# Meta / Instagram Integration

`MetaInstagramAdapter` (`src/modules/integrations/adapters/MetaInstagramAdapter.js`) is a **mock implementation** — no real Meta Graph API calls are made anywhere in this codebase.

## Tools

There are 6 Instagram tools registered in `registerIntegrationTools.js`.

| Tool | Status | Notes |
|---|---|---|
| `publish_instagram_post` | MOCKED FOR TESTING | Returns a fake `externalResourceId`; enforces lifecycle + idempotency (real, not mocked — see below) |
| `publish_instagram_carousel` | MOCKED FOR TESTING | Same pattern as `publish_instagram_post` |
| `publish_instagram_reel` | MOCKED FOR TESTING | Same pattern as `publish_instagram_post` |
| `schedule_instagram_content` | MOCKED FOR TESTING | Updates `Content.status`/`scheduledAt` directly; there is no real job/worker system to actually fire the publish at `scheduledAt` |
| `get_instagram_profile` | MOCKED FOR TESTING | Returns fixed fake profile data |
| `get_instagram_content_metrics` | MOCKED FOR TESTING | Returns fixed fake engagement numbers |

Real Meta Graph API access **REQUIRES EXTERNAL CONFIGURATION**: a registered Meta app, OAuth app credentials (`META_APP_ID`/`META_APP_SECRET`), a real access token per connected account, and a real webhook signing secret (`META_WEBHOOK_VERIFY_TOKEN`). None of these exist yet — see `.env.example`.

## Enforcement that IS real (not mocked)

These checks run in every publish/schedule tool and are backed by real database constraints — only the *provider call* is mocked, not the guardrails around it.

- **Lifecycle enforcement — IMPLEMENTED.** `Content.status` must be `"approved"`, or the tool returns `INVALID_LIFECYCLE_STATE` without ever reaching the adapter.
- **Connection enforcement — IMPLEMENTED.** An `IntegrationAccount` with `status: "active"` must exist for the given `integrationAccountId`, or the tool returns `NOT_CONNECTED`.
- **Idempotency — IMPLEMENTED.** Every call creates an `IntegrationExecution` with a required `idempotencyKey`, enforced unique per `{organizationId, idempotencyKey}` at the database level. A retried/duplicate call returns `DUPLICATE_OPERATION` instead of re-executing.
- **Audit trail — IMPLEMENTED.** A successful publish/schedule also writes an `AuditLog` entry via `AuditService.logIntegrationAction`.

See [webhooks.md](./webhooks.md) for the inbound side (Meta → us).
