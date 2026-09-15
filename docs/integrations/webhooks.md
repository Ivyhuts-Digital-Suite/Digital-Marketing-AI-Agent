# Webhooks

## Flow

```
Provider (Meta)
  → POST /api/integrations/meta/webhook
    → WebhookService.processWebhook({ provider, rawPayload, signatureHeader })
      1. verifyWebhookSignature(rawBody, signatureHeader)
      2. normalizeWebhookPayload(provider, rawPayload)
      3. IntegrationWebhookEvent.create({ ..., status: "received" })  — idempotent
      4. event.status = "processed"
```

Only `meta` is wired up as a provider in `normalizeWebhookPayload` today; any other provider throws `Unsupported webhook provider: "<provider>"`.

## Signature verification

**Status: MOCKED FOR TESTING.** `verifyWebhookSignature` only checks that a signature header is a non-empty string — it does **not** perform real HMAC verification and must never be treated as a real security boundary. This is explicitly flagged in the function's own JSDoc.

Real verification **REQUIRES EXTERNAL CONFIGURATION**: a real Meta app signing secret (`META_WEBHOOK_VERIFY_TOKEN`), and replacing the mock check with actual `X-Hub-Signature-256` HMAC-SHA256 verification against the raw request body.

## Idempotent event handling

**Status: IMPLEMENTED.** `IntegrationWebhookEvent` has a unique index on `{provider, externalEventId}`. A redelivered event (the same provider event id arriving twice) hits that constraint, is caught, and returns `{ success: true, data: { duplicate: true } }` rather than reprocessing — this is success, not failure, since the event was already handled.

## What happens to the data after this

**Status: NOT YET IMPLEMENTED.** Per `WebhookService.js`'s own header comment: raw webhook payloads must never directly mutate domain models — only `IntegrationWebhookEvent.normalizedPayload` is meant to be used downstream. No consumer of `IntegrationWebhookEvent` records exists yet (e.g. nothing currently marks a `Content` item as published in response to an `instagram_publish_status` event). That's a separate, not-yet-built step.
