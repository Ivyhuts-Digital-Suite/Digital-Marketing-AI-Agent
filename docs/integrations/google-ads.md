# Google Ads Integration

`MockGoogleAdsAdapter` (`src/modules/integrations/adapters/MockGoogleAdsAdapter.js`) is a **mock implementation** — no real Google Ads API calls are made anywhere in this codebase.

## Tools

All 4 Google Ads tools are **read-only by design** — there are no write/mutation tools (no campaign creation, bid changes, etc.) for this provider yet.

| Tool | Status | Notes |
|---|---|---|
| `get_google_campaign_insights` | MOCKED FOR TESTING | Returns fixed fake impressions/clicks/conversions/spend/CTR |
| `get_google_keyword_performance` | MOCKED FOR TESTING | Returns fixed fake keyword-level performance |
| `get_google_ad_performance` | MOCKED FOR TESTING | Returns fixed fake per-ad performance |
| `get_google_budget_insights` | MOCKED FOR TESTING | Returns fixed fake budget/spend data |

Real Google Ads API access **REQUIRES EXTERNAL CONFIGURATION**: a Google Ads API client ID/secret, a developer token, and an OAuth-connected account. None of these exist yet — see `.env.example`.

## Enforcement

Unlike the Instagram publish tools, these are read-only queries: no `Content` lifecycle check applies, and no `IntegrationExecution` record is created (nothing is being mutated externally). Each call still goes through `IntegrationAdapterFactory.get("google_ads")`, so swapping in a real adapter later requires no change to the tools themselves.
