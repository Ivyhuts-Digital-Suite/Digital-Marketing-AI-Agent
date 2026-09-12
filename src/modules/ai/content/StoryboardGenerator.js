/**
 * @file Rule-based storyboard builder.
 *
 * This is an MVP placeholder, in the same spirit as ./VisualConceptGenerator.js's
 * rule-based approach: it derives a Storyboard directly from a
 * VideoScript's scenes (plus an optional VisualConcept for animation
 * direction), with no AI model call. Per the roadmap, a future version
 * should let an AI model reason over the script for genuinely tailored
 * camera/animation/asset direction per scene.
 */

const DEFAULT_ANIMATION = "Simple cut transition";

/**
 * Determines camera direction for a scene by its position: the first
 * scene gets a static establishing shot, the last gets a medium pan, and
 * everything in between gets a close-up.
 * @param {number} order - The scene's 1-based position.
 * @param {number} totalScenes - Total number of scenes in the script.
 * @returns {string}
 */
function resolveCameraDirection(order, totalScenes) {
  if (order === 1) {
    return "Static shot";
  }

  if (order === totalScenes) {
    return "Medium pan";
  }

  return "Close-up";
}

/**
 * Determines asset requirements for a scene by its position: the first
 * scene needs the brand logo, the last needs a CTA graphic, and scenes
 * in between need nothing extra.
 * @param {number} order - The scene's 1-based position.
 * @param {number} totalScenes - Total number of scenes in the script.
 * @returns {string[]}
 */
function resolveAssetRequirements(order, totalScenes) {
  if (order === 1) {
    return ["brand logo"];
  }

  if (order === totalScenes) {
    return ["cta graphic"];
  }

  return [];
}

/**
 * Builds a Storyboard from a VideoScript, using fixed, rule-based logic
 * for camera direction and asset requirements, and an optional
 * VisualConcept for animation direction.
 * @param {import("../types/videoEngine.types.js").VideoScript} videoScript
 * @param {import("../types/graphicEngine.types.js").VisualConcept} [visualConcept] - Optional; may be undefined.
 * @returns {import("../types/videoEngine.types.js").Storyboard} The resulting storyboard.
 */
export function buildStoryboard(videoScript, visualConcept) {
  const totalScenes = videoScript.scenes.length;

  const scenes = videoScript.scenes.map((scene) => ({
    sceneNumber: scene.order,
    duration: scene.duration,
    visualDescription: scene.visualDescription,
    cameraDirection: resolveCameraDirection(scene.order, totalScenes),
    animation: visualConcept?.visualApproach || DEFAULT_ANIMATION,
    narration: scene.narration,
    onScreenText: scene.onScreenText,
    assetRequirements: resolveAssetRequirements(scene.order, totalScenes)
  }));

  return { scenes };
}
