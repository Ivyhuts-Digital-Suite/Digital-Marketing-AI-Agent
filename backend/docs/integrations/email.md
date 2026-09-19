# Email Integration

`MockEmailAdapter` (`src/modules/integrations/adapters/MockEmailAdapter.js`) is a **mock implementation** — no real email provider API calls are made anywhere in this codebase. It is deliberately provider-agnostic; no specific email provider has been chosen or integrated yet.

## Tools

| Tool | Status | Notes |
|---|---|---|
| `create_email_campaign` | MOCKED FOR TESTING | Returns a fake draft `campaignId`; no real send capability |
| `segment_email_audience` | MOCKED FOR TESTING | Returns a fake `segmentId`/`estimatedSize` |
| `get_email_campaign_metrics` | MOCKED FOR TESTING | Returns fixed fake sent/delivered/opened/clicked/bounced/unsubscribed counts |
| `get_email_performance` | MOCKED FOR TESTING | Returns fixed fake open/click/bounce rates |

## Provider status

Real email provider access **REQUIRES EXTERNAL CONFIGURATION** and, further, is **NOT YET IMPLEMENTED for any specific provider**. Per the roadmap, likely future candidates include:

- Mailchimp
- Brevo
- SendGrid
- Klaviyo
- HubSpot (marketing email)

None of these has an adapter, credentials, or even a chosen provider yet — `email` in `.env.example` is a single generic placeholder (`EMAIL_PROVIDER_API_KEY`) until that decision is made.
