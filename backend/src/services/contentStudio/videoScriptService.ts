import { ICreativeBrief } from "../../models/CreativeBrief";
import { MotionGraphicScene, VideoScript, VideoStyle } from "./contentStudio.types";

const HOOK_DURATION = 3;
const BODY_SCENE_DURATION = 4;
const CTA_DURATION = 3;
const MAX_BODY_SCENES = 4;

/**
 * Video Engine pipeline Step 1 (Script): deterministic, not an LLM call.
 * The brief's hook/coreMessage/keyPoints/cta are already-approved marketing
 * copy - this only restructures them into a script shell, it never
 * rewrites or invents new claims/messaging (see Phase 6/16: "AI media
 * models EXECUTE creative instructions, they do NOT decide what marketing
 * content should be created").
 */
export function generateVideoScript(brief: ICreativeBrief, videoStyle: VideoStyle = "motion_graphic"): VideoScript {
  const bodySceneCount = Math.max(Math.min(brief.keyPoints.length, MAX_BODY_SCENES), 1);
  const totalDuration = HOOK_DURATION + bodySceneCount * BODY_SCENE_DURATION + CTA_DURATION;

  return {
    title: brief.topic,
    totalDuration,
    hook: brief.hook,
    cta: brief.cta,
    videoStyle,
  };
}

/**
 * Video Engine pipeline Steps 2-3 (Storyboard + Scene Planner): turns the
 * script into a structured, providable MotionGraphicScene[]. animationInstructions
 * differ by videoStyle - "motion_graphic" scenes carry explicit on-screen
 * animation moves a graphics/animation provider (or human editor) can
 * execute directly; "cinematic" scenes carry camera/live-action direction
 * instead. Every provider preserves this structure even if it can't
 * execute every instruction literally (see contentStudio.types.ts).
 */
export function buildStoryboard(brief: ICreativeBrief, script: VideoScript): MotionGraphicScene[] {
  const bodyPoints = brief.keyPoints.length > 0 ? brief.keyPoints.slice(0, MAX_BODY_SCENES) : [brief.coreMessage];
  const isMotionGraphic = script.videoStyle === "motion_graphic";

  const scenes: MotionGraphicScene[] = [];
  let sceneNumber = 1;

  scenes.push({
    sceneNumber: sceneNumber++,
    duration: HOOK_DURATION,
    narration: script.hook,
    onScreenText: script.hook,
    visualDescription: isMotionGraphic
      ? `Bold opening title card introducing "${brief.topic}" - ${brief.visualDirection.mood} mood, ${brief.visualDirection.style} graphic style.`
      : `Live-action opening shot establishing "${brief.topic}" - ${brief.visualDirection.mood} mood, ${brief.visualDirection.style} cinematography.`,
    animationInstructions: isMotionGraphic
      ? "Hook text enters from left, quick scale-in on emphasis words."
      : "Slow push-in (dolly-in) on the opening subject, natural handheld motion.",
    transition: "cut",
    assetRequirements: brief.visualDirection.visualElements,
  });

  for (const point of bodyPoints) {
    scenes.push({
      sceneNumber: sceneNumber++,
      duration: BODY_SCENE_DURATION,
      narration: point,
      onScreenText: point,
      visualDescription: isMotionGraphic
        ? `Supporting graphic card for: "${point}", composition: ${brief.visualDirection.composition}.`
        : `Supporting live-action scene for: "${point}", composition: ${brief.visualDirection.composition}.`,
      animationInstructions: isMotionGraphic
        ? "Icon scales in, text card slides upward, key number counts up if present."
        : "Steady tracking shot, smooth focus pull onto the supporting subject.",
      transition: "cut",
      assetRequirements: brief.visualDirection.visualElements,
    });
  }

  scenes.push({
    sceneNumber: sceneNumber++,
    duration: CTA_DURATION,
    narration: script.cta,
    onScreenText: script.cta,
    visualDescription: isMotionGraphic
      ? "Closing CTA card with brand identity and pulse animation."
      : "Closing live-action frame with brand identity overlay.",
    animationInstructions: isMotionGraphic ? "CTA card pulse animation, brand logo fade-in." : "Hold shot, brand logo fade-in overlay.",
    transition: "fade",
    assetRequirements: ["brand logo"],
  });

  return scenes;
}
