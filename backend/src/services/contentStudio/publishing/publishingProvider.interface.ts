/**
 * Phase 9 - Step 9: Publishing abstraction.
 *
 * No real Instagram integration exists in this codebase yet (confirmed by
 * a full-repo audit before writing this). The spec is explicit: build the
 * scheduling system and this abstraction now, not a real Instagram API
 * integration - see mockPublishingProvider.ts and publishingProviderFactory.ts.
 * A future InstagramPublishingProvider implements this same interface;
 * nothing else in the codebase needs to change when it's added.
 */
export interface PublishRequest {
  organizationId: string;
  contentItemId: string;
  platform: "instagram";
  caption: string;
  assetUrls: string[];
}

export interface PublishResult {
  success: boolean;
  /** The provider's own identifier for the live post. Only ever set on a real, non-mock success - never fabricated. */
  externalPostId?: string;
  publishedAt?: Date;
  /** true for any development/testing provider - callers must never present a mock result as a real Instagram post. */
  isMock: boolean;
  message: string;
}

export interface PublishingProvider {
  name: string;
  publish(request: PublishRequest): Promise<PublishResult>;
}
