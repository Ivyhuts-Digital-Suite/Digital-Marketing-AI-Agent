/**
 * @file Rule-based scene asset method selector.
 *
 * This is an MVP placeholder, in the same spirit as ./VisualConceptGenerator.js
 * and ./StoryboardGenerator.js: it picks a production method for each
 * storyboard scene using fixed rules over the scene's own fields, with
 * no AI model call. Per the roadmap, a future version should let an AI
 * model (or richer heuristics informed by budget/brand assets on hand)
 * make this call instead.
 */

/**
 * Chooses a production method for a single storyboard scene.
 * @param {import("../types/videoEngine.types.js").StoryboardScene} storyboardScene
 * @returns {import("../types/sceneGeneration.types.js").AssetSelection} The chosen method for this scene.
 */
export function selectAssetMethod(storyboardScene) {
  if (
    storyboardScene.assetRequirements.includes("brand logo") ||
    storyboardScene.assetRequirements.includes("cta graphic")
  ) {
    return {
      sceneNumber: storyboardScene.sceneNumber,
      method: "motion_graphics",
      reason: "Scene requires branded overlay elements"
    };
  }

  if (storyboardScene.cameraDirection === "Close-up") {
    return {
      sceneNumber: storyboardScene.sceneNumber,
      method: "ai_video",
      reason: "Close-up shots benefit from AI-generated dynamic footage"
    };
  }

  if (
    storyboardScene.assetRequirements.length === 0 &&
    storyboardScene.cameraDirection === "Static shot"
  ) {
    return {
      sceneNumber: storyboardScene.sceneNumber,
      method: "image_animation",
      reason: "Static establishing shots work well as animated images"
    };
  }

  return {
    sceneNumber: storyboardScene.sceneNumber,
    method: "stock_footage",
    reason: "Default fallback for general scene coverage"
  };
}

/**
 * Chooses a production method for every scene in a storyboard.
 * @param {import("../types/videoEngine.types.js").Storyboard} storyboard
 * @returns {import("../types/sceneGeneration.types.js").AssetSelection[]} The chosen method per scene, in order.
 */
export function selectAssetMethodsForStoryboard(storyboard) {
  return storyboard.scenes.map(selectAssetMethod);
}
