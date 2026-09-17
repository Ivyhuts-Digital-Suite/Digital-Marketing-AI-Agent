# Integration Layer Architecture

This describes the actual, currently-implemented shape of the integration layer — not the target end state.

## Request flow

```
Agent (e.g. CampaignAgent)
  → Tool (ToolRegistry, e.g. publish_instagram_post)
    → Integration Service (IntegrationAdapterFactory)
      → Provider Adapter (e.g. MetaInstagramAdapter — currently a mock)
        → External API (not called yet — no real provider credentials exist)
```

`CampaignAgent` never talks to a provider adapter directly. It resolves a tool by name via `ToolRegistry`, calls `tool.execute(input, context)`, and returns the tool's result. Each tool is the only code that knows which `IntegrationAdapterFactory` entry to use for its operation.

**Status: IMPLEMENTED.** Verified end-to-end via `Orchestrator.runAgent()` → `CampaignAgent` → tool → adapter, both directly and over HTTP (`POST /api/integrations/instagram/publish`).

## Security rule

**Agents never call provider SDKs, hold OAuth tokens, or import an adapter directly.** An agent only knows tool names and capabilities; a tool is the only layer that knows which adapter to call and how. See [security.md](./security.md) for the full rule and how credentials are kept out of agent/tool code.

## Core models

| Model | Purpose | Status |
|---|---|---|
| `Integration` | One organization's connection to a provider (status, permissions) | IMPLEMENTED |
| `IntegrationAccount` | A specific external account under an `Integration` (token reference, external IDs) | IMPLEMENTED |
| `IntegrationExecution` | One record per tool call: idempotent (unique `{organizationId, idempotencyKey}`), status-tracked (`pending → in_progress → completed/failed`) | IMPLEMENTED |
| `IntegrationWebhookEvent` | One record per inbound webhook event: idempotent (unique `{provider, externalEventId}`) | IMPLEMENTED |

## Where things stand

- **Meta/Instagram, Google Ads, Email, CRM**: adapters exist and are wired up, but every one is a mock — see the per-provider docs.
- **Credential storage**: functional MVP (AES-256-GCM, in-memory), not production-grade — see [security.md](./security.md).
- **Real provider API calls**: none exist yet anywhere in the codebase.
