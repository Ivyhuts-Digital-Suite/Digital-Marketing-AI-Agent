export class InvalidContentStudioInputError extends Error {
  constructor(reason: string) {
    super(`Invalid content studio input: ${reason}`);
    this.name = "InvalidContentStudioInputError";
  }
}

export class ContentItemNotFoundError extends Error {
  constructor(contentItemId: string) {
    super(`Content item "${contentItemId}" was not found for the given content plan.`);
    this.name = "ContentItemNotFoundError";
  }
}

export class CreativeBriefNotFoundError extends Error {
  constructor(contentItemId: string) {
    super(`No creative brief exists yet for content item "${contentItemId}".`);
    this.name = "CreativeBriefNotFoundError";
  }
}

/** The plan isn't "finalized" or "in_progress" yet, so generation can't start (see ContentPlanStatus). */
export class PlanNotReadyForGenerationError extends Error {
  constructor(planId: string, status: string) {
    super(`Content plan "${planId}" is "${status}" - it must be "finalized" or "in_progress" before generating assets.`);
    this.name = "PlanNotReadyForGenerationError";
  }
}

/** The content item's format needs a different generation engine than the one the caller invoked (e.g. calling /videos/generate on a "post"). */
export class FormatEngineMismatchError extends Error {
  constructor(format: string, expectedEngine: string, actualEngine: string) {
    super(
      `Content item format "${format}" requires the "${actualEngine}" generation engine, not "${expectedEngine}".`
    );
    this.name = "FormatEngineMismatchError";
  }
}

/** The content item's format/channel isn't one Content Studio can generate media for yet (e.g. "blog", "email"). */
export class UnsupportedFormatForGenerationError extends Error {
  constructor(format: string) {
    super(`Content format "${format}" is not supported by Content Studio generation yet.`);
    this.name = "UnsupportedFormatForGenerationError";
  }
}

export class ContentStudioConfigurationError extends Error {
  constructor(reason: string) {
    super(`Content studio is not configured correctly: ${reason}`);
    this.name = "ContentStudioConfigurationError";
  }
}

export class ContentStudioLlmRequestError extends Error {
  constructor(reason: string) {
    super(`Content studio LLM request failed: ${reason}`);
    this.name = "ContentStudioLlmRequestError";
  }
}

export class InvalidContentStudioLlmResponseError extends Error {
  constructor(reason: string) {
    super(`Content studio LLM response was invalid: ${reason}`);
    this.name = "InvalidContentStudioLlmResponseError";
  }
}

export class ContentStudioDatabaseError extends Error {
  constructor(reason: string) {
    super(`Content studio database operation failed: ${reason}`);
    this.name = "ContentStudioDatabaseError";
  }
}

export class GenerationProviderError extends Error {
  constructor(provider: string, reason: string) {
    super(`Generation provider "${provider}" failed: ${reason}`);
    this.name = "GenerationProviderError";
  }
}

export class GenerationInProgressError extends Error {
  constructor() {
    super("A video generation is already in progress for this content item.");
    this.name = "GenerationInProgressError";
  }
}

export type MediaProviderErrorCode =
  | "MEDIA_PROVIDER_NOT_CONFIGURED" | "MEDIA_PROVIDER_AUTH_FAILED" | "MEDIA_PROVIDER_RATE_LIMITED"
  | "MEDIA_PROVIDER_QUOTA_EXCEEDED"
  | "MEDIA_PROVIDER_TIMEOUT" | "MEDIA_PROVIDER_UNAVAILABLE" | "MEDIA_GENERATION_FAILED"
  | "MEDIA_OUTPUT_MISSING" | "MEDIA_STORAGE_FAILED" | "MEDIA_CAPABILITY_NOT_SUPPORTED" | "MEDIA_INVALID_REQUEST";

export class MediaProviderError extends Error {
  constructor(public readonly code: MediaProviderErrorCode, message: string) {
    super(message);
    this.name = "MediaProviderError";
  }
}

export class GenerationJobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Generation job "${jobId}" was not found.`);
    this.name = "GenerationJobNotFoundError";
  }
}

/**
 * Phase 9: thrown by ContentLifecycleService whenever a requested
 * transition isn't in the valid-transition table for that status field.
 * This is the ONLY error a controller ever sees for an illegal status
 * change - there is no code path that mutates approvalStatus/
 * publishingStatus outside contentLifecycleService.ts.
 */
export class InvalidLifecycleTransitionError extends Error {
  constructor(statusField: string, from: string, to: string) {
    super(`Cannot transition ${statusField} from "${from}" to "${to}".`);
    this.name = "InvalidLifecycleTransitionError";
  }
}

export class RequestChangesRequiresCommentError extends Error {
  constructor() {
    super("A comment is required when requesting changes.");
    this.name = "RequestChangesRequiresCommentError";
  }
}

export class SchedulingValidationError extends Error {
  constructor(reason: string) {
    super(`Cannot schedule this content: ${reason}`);
    this.name = "SchedulingValidationError";
  }
}

export class ContentQualityCheckNotFoundError extends Error {
  constructor(contentItemId: string) {
    super(`No quality check has been run yet for content item "${contentItemId}".`);
    this.name = "ContentQualityCheckNotFoundError";
  }
}

/** Content cannot be submitted for review because its latest quality check hasn't passed (or hasn't run yet). AI quality-passing is a precondition for REVIEW, never a substitute for human approval. */
export class QualityGateNotPassedError extends Error {
  constructor(contentItemId: string, reason: string) {
    super(`Content item "${contentItemId}" cannot be submitted for review: ${reason}`);
    this.name = "QualityGateNotPassedError";
  }
}

export class GenerationNotCompleteError extends Error {
  constructor(contentItemId: string, generationStatus: string) {
    super(`Content item "${contentItemId}" has not finished generation yet (generationStatus: "${generationStatus}").`);
    this.name = "GenerationNotCompleteError";
  }
}

/** Missing/invalid config that prevents calling the quality-check LLM at all (mirrors ContentStudioConfigurationError's role for the generation LLM). */
export class QualityCheckConfigurationError extends Error {
  constructor(reason: string) {
    super(`Content quality check is not configured correctly: ${reason}`);
    this.name = "QualityCheckConfigurationError";
  }
}

export class PublishingProviderError extends Error {
  constructor(provider: string, reason: string) {
    super(`Publishing provider "${provider}" failed: ${reason}`);
    this.name = "PublishingProviderError";
  }
}
