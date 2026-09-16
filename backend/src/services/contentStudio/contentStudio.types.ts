import { IContentItem } from "../../models/ContentItem";
import { IContentPlan } from "../../models/ContentPlan";
import { ICreativeBrief } from "../../models/CreativeBrief";

/** The three resources every generation step is scoped to, resolved and validated once by contentGenerationRouterService. */
export interface ResolvedGenerationContext {
  plan: IContentPlan;
  item: IContentItem;
  brief: ICreativeBrief;
}

export type GenerationEngine = "graphic" | "video";

/** Step 1 of the graphic pipeline: a plain-language description of what the image should look like, derived from the brief's visualDirection - not yet a concrete render spec. */
export interface VisualConcept {
  subject: string;
  style: string;
  mood: string;
  composition: string;
  visualElements: string[];
  colorGuidance: string;
  typographyGuidance: string;
}

/** Step 2 of the graphic pipeline: a concrete, providable spec for one image render. "ai_image_generation" is the only render mode implemented today - "template_rendering" is a defined-but-not-yet-built extension point for deterministic canvas/template output. */
export type GraphicRenderMode = "ai_image_generation" | "template_rendering";

/** Rendering choice for a graphic, selected by the caller (never invented by a media model) - "infographic" is a distinct design specification, not a generic image with more text (see Part A/9 of the Content Engine spec). */
export type GraphicStyle = "standard" | "infographic";

/** Structured content for an infographic design - title/stats/points/icons/CTA are laid out deliberately rather than left to free-text image generation. All fields are copied from the already-approved CreativeBrief, never invented at this layer. */
export interface InfographicSpec {
  title: string;
  keyStatistics: string[];
  keyPoints: string[];
  iconHints: string[];
  cta: string;
}

export interface DesignSpecification {
  renderMode: GraphicRenderMode;
  aspectRatio: string;
  subtype: string;
  onScreenText?: string;
  visualConcept: VisualConcept;
  slideIndex?: number;
  slideCount?: number;
  /** Present only when this spec renders as a structured infographic (see GraphicStyle). */
  infographic?: InfographicSpec;
}

/** One scene in a motion-graphic video's structured plan. Mirrors the roadmap's MotionGraphicScene shape. */
export interface MotionGraphicScene {
  sceneNumber: number;
  duration: number;
  narration?: string;
  onScreenText?: string;
  visualDescription: string;
  animationInstructions?: string;
  transition?: string;
  assetRequirements?: string[];
}

/**
 * Which kind of video to produce - selected by the caller (never invented
 * by the video model, same principle as GraphicStyle). "motion_graphic"
 * biases scene direction toward explicit on-screen animation moves (text/
 * icon/chart motion); "cinematic" biases toward live-action-style visual
 * description and camera direction. Both still go through the same
 * script -> storyboard -> scenes -> provider pipeline.
 */
export type VideoStyle = "motion_graphic" | "cinematic";

export interface VideoScript {
  title: string;
  totalDuration: number;
  hook: string;
  cta: string;
  videoStyle: VideoStyle;
}

export interface BrandValidationResult {
  passed: boolean;
  score?: number;
  issues: string[];
  suggestions: string[];
}
