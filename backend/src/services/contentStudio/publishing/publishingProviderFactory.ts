import { PublishingProvider } from "./publishingProvider.interface";
import { MockPublishingProvider } from "./mockPublishingProvider";

/**
 * No real InstagramPublishingProvider exists yet - the Phase 9 spec is
 * explicit that this phase builds the scheduling system and this
 * abstraction, not the Instagram API integration itself. "mock" is the
 * only supported value; anything else throws rather than silently falling
 * back to a fake provider (mirrors imageProviderFactory.ts/
 * videoProviderFactory.ts's own configuration-error convention).
 */
export function getPublishingProvider(): PublishingProvider {
  const configured = (process.env.PUBLISHING_PROVIDER || "mock").trim().toLowerCase();

  if (configured === "mock") {
    return new MockPublishingProvider();
  }

  throw new Error(
    `Publishing provider "${configured}" is not implemented - no real Instagram integration exists in this codebase yet. Set PUBLISHING_PROVIDER=mock for development, or implement a real InstagramPublishingProvider first.`
  );
}
