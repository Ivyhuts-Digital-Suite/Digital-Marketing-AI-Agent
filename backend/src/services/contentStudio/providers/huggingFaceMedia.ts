import { HuggingFaceConfigurationError } from "../../../config/huggingface";
import { MediaProviderError } from "../errors";

export const MEDIA_TIMEOUT_MS = Number(process.env.HUGGINGFACE_MEDIA_TIMEOUT_MS) || 15 * 60 * 1000;

export function mediaAbortSignal(): AbortSignal {
  return AbortSignal.timeout(MEDIA_TIMEOUT_MS);
}

export function normalizeHuggingFaceError(error: unknown): never {
  if (error instanceof MediaProviderError) throw error;
  if (error instanceof HuggingFaceConfigurationError) {
    throw new MediaProviderError("MEDIA_PROVIDER_NOT_CONFIGURED", "Hugging Face media generation is not configured. Add HUGGINGFACE_API_KEY to enable real image/video generation.");
  }
  const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status) : 0;
  const message = error instanceof Error ? error.message : "Hugging Face media generation failed.";
  if (status === 401 || status === 403) throw new MediaProviderError("MEDIA_PROVIDER_AUTH_FAILED", "Hugging Face authentication failed.");
  // Verified live (2026-09-15): a depleted monthly Inference Providers credit
  // balance surfaces as a plain-text "Failed to perform inference: You have
  // depleted your monthly included credits..." message, not a distinguishable
  // status code - this used to fall through to the generic
  // MEDIA_GENERATION_FAILED bucket (502), which looked identical to a real
  // bug from the outside. It's a billing condition, not a transient rate
  // limit or a code defect - retrying won't help until credits are topped up
  // or the monthly cycle resets.
  if (/depleted|purchase.*credit|insufficient.*credit/i.test(message)) {
    throw new MediaProviderError(
      "MEDIA_PROVIDER_QUOTA_EXCEEDED",
      "Hugging Face's monthly included Inference Providers credits are depleted. Purchase pre-paid credits or upgrade to PRO at https://huggingface.co/settings/billing to continue generating real media."
    );
  }
  if (status === 429) throw new MediaProviderError("MEDIA_PROVIDER_RATE_LIMITED", "Hugging Face media generation is rate limited.");
  if (status === 503 || /loading|temporarily unavailable/i.test(message)) throw new MediaProviderError("MEDIA_PROVIDER_UNAVAILABLE", "Hugging Face media provider is temporarily unavailable.");
  if (/abort|timeout/i.test(message)) throw new MediaProviderError("MEDIA_PROVIDER_TIMEOUT", "Hugging Face media generation timed out.");
  // Keep the real upstream message (e.g. fal.ai's own validation error text) -
  // a bare "generation failed" with the specifics discarded was hard to
  // diagnose from the API response or the server log alike.
  throw new MediaProviderError("MEDIA_GENERATION_FAILED", `Hugging Face media generation failed: ${message}`);
}

export async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.length === 0) throw new MediaProviderError("MEDIA_OUTPUT_MISSING", "Hugging Face returned no media bytes.");
  return buffer;
}
