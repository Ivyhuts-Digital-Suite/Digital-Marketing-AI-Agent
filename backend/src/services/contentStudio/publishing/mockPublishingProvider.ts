import { PublishingProvider, PublishRequest, PublishResult } from "./publishingProvider.interface";

/**
 * Explicit development/testing provider ONLY. `isMock: true` and a
 * "mock-"-prefixed externalPostId make it unambiguous everywhere this
 * result is displayed, persisted (ContentItem.publishingProvider === "mock"),
 * or asserted against in tests - this must never be presented to a user or
 * stored as if it were a real Instagram post.
 */
export class MockPublishingProvider implements PublishingProvider {
  readonly name = "mock";

  async publish(request: PublishRequest): Promise<PublishResult> {
    return {
      success: true,
      externalPostId: `mock-${request.contentItemId}-${Date.now()}`,
      publishedAt: new Date(),
      isMock: true,
      message: "Published via MockPublishingProvider - a development simulation, not a real Instagram post.",
    };
  }
}
