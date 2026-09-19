# Integration Security

## The rule

**Agents never access OAuth tokens, credentials, or provider SDKs directly.** An agent (e.g. `CampaignAgent`) only knows a tool name and a set of params. A tool is the only layer that resolves a provider adapter via `IntegrationAdapterFactory`; the adapter is the only layer that would ever hold or use a real credential. No credential value ever appears in agent code, plan steps, logs, or `AgentRun`/`AuditLog` records — only opaque references (`tokenReference`, `integrationAccountId`) do.

**Status: IMPLEMENTED**, and true by construction today — there are no real credentials anywhere in the codebase yet to leak, since every adapter is a mock.

## Credential storage

`IntegrationCredentialService` (`src/modules/integrations/services/IntegrationCredentialService.js`):

| Property | Status | Notes |
|---|---|---|
| Encryption | IMPLEMENTED | AES-256-GCM via Node's built-in `crypto`, key from `CREDENTIAL_ENCRYPTION_KEY` |
| Storage | IMPLEMENTED as MVP | **In-memory `Map`, not persisted anywhere.** Lost on every process restart. `IntegrationAccount.tokenReference` is the pointer field; no dedicated Mongoose model was added. |
| Production readiness | NOT PRODUCTION-GRADE | Explicitly flagged in the file's own header comment: replace with a real secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) before any real credential is ever stored. |

## Connection & lifecycle enforcement

These run on every mutating Instagram tool call, ahead of any provider call:

| Check | Status | Effect |
|---|---|---|
| `NOT_CONNECTED` | IMPLEMENTED | Requires an `IntegrationAccount` with `status: "active"` for the given `integrationAccountId` |
| `INVALID_LIFECYCLE_STATE` | IMPLEMENTED | Requires `Content.status === "approved"` before publish/schedule |
| `DUPLICATE_OPERATION` | IMPLEMENTED | Unique `{organizationId, idempotencyKey}` index on `IntegrationExecution` rejects retried/duplicate calls at the database level |

See [IntegrationErrorCodes.js](../../src/modules/integrations/errors/IntegrationErrorCodes.js) for the full canonical error code list (10 codes; not all are wired into every tool yet — e.g. `TOKEN_EXPIRED` and `INSUFFICIENT_PERMISSION` are defined but not yet checked anywhere, since there are no real tokens/scopes to check).

## Audit trail

`AuditService.logIntegrationAction` (IMPLEMENTED) writes to the existing `AuditLog` collection after a successful publish/schedule — reusing existing governance infrastructure rather than duplicating it. See [architecture.md](./architecture.md) for how this fits into the overall flow.

## Webhook authenticity

See [webhooks.md](./webhooks.md) — inbound signature verification is currently **MOCKED FOR TESTING**, not a real security boundary.
