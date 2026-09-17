# CRM Integration

`MockCRMAdapter` (`src/modules/integrations/adapters/MockCRMAdapter.js`) is a **mock implementation** — no real CRM provider API calls are made anywhere in this codebase. It is provider-agnostic; no specific CRM has been chosen or integrated yet.

## Tools

All 4 CRM tools are **read-only** — there are currently no write tools for this provider.

| Tool | Status | Notes |
|---|---|---|
| `get_leads` | MOCKED FOR TESTING | Returns a fixed fake list of leads |
| `get_contacts` | MOCKED FOR TESTING | Returns a fixed fake list of contacts |
| `get_pipeline` | MOCKED FOR TESTING | Returns a fixed fake stage breakdown |
| `get_revenue` | MOCKED FOR TESTING | Returns fixed fake revenue/deal figures for a period |

Real CRM API access **REQUIRES EXTERNAL CONFIGURATION**: a chosen CRM provider, its API credentials, and an OAuth- or API-key-connected account. `CRM_PROVIDER_API_KEY` in `.env.example` is a placeholder until a provider is chosen.

## Not yet implemented

`create_lead` and `update_lead` (or any other CRM write capability) do **not exist** — no tool, no adapter method, nothing. These are future write capabilities, not a gap in an otherwise-complete set.
