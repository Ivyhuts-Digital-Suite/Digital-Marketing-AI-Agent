import { InfographicSpec } from "../contentStudio.types";

/**
 * Image generation abstraction for the Graphic Engine. Provider-agnostic so
 * a real vendor (OpenAI Images, Gemini, Stability, etc.) can be swapped in
 * without changing graphicGenerationService.
 *
 * ImageGenerationRequest carries structured fields derived from the
 * CreativeBrief/DesignSpecification - never an uncontrolled free-text
 * prompt - so a provider implementation decides how to turn structure into
 * a prompt, keeping that decision out of the calling service.
 */

export interface ImageGenerationRequest {
  format: string;
  subtype: string;
  aspectRatio: string;
  topic: string;
  hook: string;
  coreMessage: string;
  keyPoints: string[];
  cta: string;
  onScreenText?: string;
  visualConcept: {
    subject: string;
    style: string;
    mood: string;
    composition: string;
    visualElements: string[];
    colorGuidance: string;
    typographyGuidance: string;
  };
  brandContext: {
    brandVoice?: string;
    allowedClaims: string[];
    forbiddenClaims: string[];
  };
  /** Present when this request is one slide of a multi-slide carousel. */
  slideIndex?: number;
  slideCount?: number;
  /** Present when this request renders as a structured infographic (see GraphicStyle in contentStudio.types.ts). */
  infographic?: InfographicSpec;
}

export interface ImageGenerationResult {
  provider: string;
  /** Model id actually used (e.g. "gemini-3.1-flash-image", "dall-e-3"), when the provider knows one. */
  model?: string;
  providerAssetId?: string;
  url: string;
  width?: number;
  height?: number;
  mimeType: string;
  /** True for any non-production (development/mock) provider - callers and validators must never treat this as a finished, deliverable asset. */
  isMock: boolean;
  raw?: unknown;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
