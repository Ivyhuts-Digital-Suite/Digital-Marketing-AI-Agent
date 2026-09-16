import { MotionGraphicScene, VideoStyle } from "../contentStudio.types";

/**
 * Video generation abstraction for the Motion Graphic Video Engine.
 * VideoGenerationRequest is the fully structured scene plan produced by the
 * script/storyboard steps - never a single unstructured prompt - so a
 * provider decides how to turn a scene plan into a render, keeping that
 * decision out of videoGenerationService.
 */

export interface VideoGenerationRequest {
  format: string;
  subtype: string;
  aspectRatio: string;
  totalDuration: number;
  videoStyle: VideoStyle;
  scenes: MotionGraphicScene[];
  cta: string;
  brandContext: {
    brandVoice?: string;
    allowedClaims: string[];
    forbiddenClaims: string[];
  };
}

export interface VideoGenerationResult {
  provider: string;
  model?: string;
  providerAssetId?: string;
  url: string;
  durationSeconds: number;
  mimeType: string;
  /** True for any non-production (development/mock) provider - callers and validators must never treat this as a finished, deliverable video. */
  isMock: boolean;
  raw?: unknown;
}

/**
 * A real video-generation service (Veo) is a long-running operation, not a
 * single request/response - "completed" and "processing" are both real
 * outcomes of one generate() call. Synchronous providers (mock) always
 * return {status: "completed"} immediately; videoGenerationService.ts
 * branches on `status` rather than assuming every provider finishes inline.
 */
export type VideoGenerationOutcome =
  | { status: "completed"; result: VideoGenerationResult }
  | {
      status: "processing";
      provider: string;
      model?: string;
      /** The provider's own job/operation id (e.g. a Veo operation name). */
      providerJobId: string;
      /** Opaque provider state to round-trip into checkStatus() on the next poll - never inspected by calling code. */
      providerOperationState: Record<string, unknown>;
    };

export interface VideoGenerationProvider {
  readonly name: string;
  /** True for providers whose generate() can return {status: "processing"} - lets callers decide whether to expect a poll loop. */
  readonly isAsync: boolean;
  generate(request: VideoGenerationRequest): Promise<VideoGenerationOutcome>;
  /** Required when isAsync is true. Checks a previously-submitted operation and returns its current outcome. */
  checkStatus?(providerOperationState: Record<string, unknown>): Promise<VideoGenerationOutcome>;
  /** Optional because the configured Wan T2V model does not support it. */
  generateVideoFromImage?(): Promise<VideoGenerationOutcome>;
}
