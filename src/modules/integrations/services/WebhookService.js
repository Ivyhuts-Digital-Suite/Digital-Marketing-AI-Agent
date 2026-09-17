import IntegrationWebhookEvent from "../../../../models/integrationWebhookEvent.model.js";

/**
 * @file Inbound webhook handling: signature verification, payload
 * normalization, and idempotent event recording.
 *
 * Per the roadmap: raw webhook payloads must never directly mutate
 * domain models — only the normalized, validated representation
 * (IntegrationWebhookEvent.normalizedPayload) should ever be used. Any
 * actual state updates this triggers (e.g. marking a Content item as
 * published based on a webhook) belong in a separate step that consumes
 * IntegrationWebhookEvent records — not implemented here yet. This
 * module's job stops at receiving and recording the event.
 */

/**
 * Verifies a webhook request's signature.
 *
 * MVP MOCK IMPLEMENTATION — this is NOT real signature verification.
 * There is no real Meta app signing secret available yet, so this only
 * checks that a signature header was sent at all. It must be replaced
 * with real Meta X-Hub-Signature-256 HMAC verification once Meta app
 * credentials exist. Never treat this as a real security boundary.
 *
 * @param {string} rawBody - The raw webhook request body.
 * @param {string} signatureHeader - The signature header value.
 * @returns {Promise<boolean>} Whether the signature "passes" this mock check.
 */
export async function verifyWebhookSignature(rawBody, signatureHeader) {
  return typeof signatureHeader === "string" && signatureHeader.length > 0;
}

/**
 * Normalizes a provider's raw webhook payload into a simplified shape.
 * @param {string} provider - The webhook provider, e.g. "meta".
 * @param {*} rawPayload - The provider's raw webhook body.
 * @returns {Promise<{ eventType: string, externalEventId: string, data: * }>} The normalized payload.
 * @throws {Error} If the provider is not supported.
 */
export async function normalizeWebhookPayload(provider, rawPayload) {
  if (provider === "meta") {
    return {
      eventType: rawPayload.field || "unknown",
      externalEventId: rawPayload.entry?.[0]?.id || `unknown_${Date.now()}`,
      data: rawPayload
    };
  }

  throw new Error(`Unsupported webhook provider: "${provider}"`);
}

/**
 * Processes an inbound webhook: verifies its signature, normalizes its
 * payload, and records it idempotently as an IntegrationWebhookEvent.
 * @param {Object} params
 * @param {string} params.provider - The webhook provider, e.g. "meta".
 * @param {*} params.rawPayload - The provider's raw webhook body.
 * @param {string} params.signatureHeader - The signature header value.
 * @returns {Promise<{ success: boolean, data?: *, error?: string }>} The processing result.
 */
export async function processWebhook({ provider, rawPayload, signatureHeader }) {
  const isValidSignature = await verifyWebhookSignature(
    rawPayload,
    signatureHeader
  );
  if (!isValidSignature) {
    return {
      success: false,
      error: "AUTHENTICATION_FAILED: invalid webhook signature"
    };
  }

  const { eventType, externalEventId, data } = await normalizeWebhookPayload(
    provider,
    rawPayload
  );

  let event;
  try {
    event = await IntegrationWebhookEvent.create({
      provider,
      eventType,
      externalEventId,
      rawPayload,
      normalizedPayload: data,
      status: "received",
      receivedAt: new Date()
    });
  } catch (error) {
    if (error.code === 11000) {
      // Idempotent: the provider redelivered an event we already have a
      // record of. This is success, not failure — the event WAS handled.
      return {
        success: true,
        data: { duplicate: true, message: "Event already processed" }
      };
    }
    throw error;
  }

  event.status = "processed";
  event.processedAt = new Date();
  await event.save();

  return { success: true, data: { eventId: event._id, eventType } };
}
