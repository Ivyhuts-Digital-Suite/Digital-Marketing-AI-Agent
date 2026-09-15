# Phase 11 — Attribution

Status: `IMPLEMENTED` for the chain-building logic itself; `REQUIRES EXTERNAL DATA` for it to produce complete chains in practice (needs real `leadId`/`contactId`/`opportunityId`/`customerId` values flowing through ingested `MarketingEvent`s from a real CRM, which requires Phase 10).

## How a chain is built

`services/analytics/attribution/attributionService.ts` starts from a real `LEAD` event for a given `contentItemId`, then follows the **same `leadId`** forward through any later `OPPORTUNITY`/`CUSTOMER`/`REVENUE` events for that organization. `chainComplete` is only `true` when all three downstream events are found. Nothing is inferred across a different `leadId`, a different organization, or a missing link.

## The literal contract from the spec

> If attribution is unavailable: return "Attribution unavailable". Do NOT fabricate revenue attribution.

`getContentAttribution`/`buildAttributionChain` return the literal string `"Attribution unavailable"` (not `null`, not a zero-filled object) whenever no matching `LEAD` event exists for the content item — verified by an automated test, alongside a second test confirming a real, fully-connected chain (including a real `revenueValue` carried through from an actual `REVENUE` event) is built correctly when the data supports it.

## Known limitation

`websiteSessionId`/`trackingUrl` linkage (Content → Campaign → Tracking URL → Website Session, per the spec's fuller chain) is `NOT YET IMPLEMENTED` — this codebase has no website-session tracking model yet. The current implementation joins purely on `leadId`, which is the strongest link available without that.
