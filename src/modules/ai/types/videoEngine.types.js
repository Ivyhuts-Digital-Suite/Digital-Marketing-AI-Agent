/**
 * @file Type definitions for the Instagram video generation engine.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A single scene within a VideoScript.
 * @typedef {Object} VideoScriptScene
 * @property {number} order - The scene's position in the script.
 * @property {number} duration - Scene duration in seconds.
 * @property {string} narration - The spoken/narrated line for this scene.
 * @property {string} onScreenText - Text overlay shown during this scene.
 * @property {string} visualDescription - What should be shown visually.
 */

/**
 * A generated script for an Instagram video (e.g. a Reel).
 * @typedef {Object} VideoScript
 * @property {string} hook - The opening line meant to stop the scroll.
 * @property {number} duration - Total video duration in seconds.
 * @property {VideoScriptScene[]} scenes - The script's scenes, in order.
 * @property {string} cta - The call to action.
 */

/**
 * A single scene within a Storyboard, with production-ready detail
 * beyond what a VideoScript's scene carries.
 * @typedef {Object} StoryboardScene
 * @property {number} sceneNumber - The scene's position in the storyboard.
 * @property {number} duration - Scene duration in seconds.
 * @property {string} visualDescription - What should be shown visually.
 * @property {string} cameraDirection - Camera movement/framing guidance.
 * @property {string} animation - Animation or transition guidance.
 * @property {string} narration - The spoken/narrated line for this scene.
 * @property {string} onScreenText - Text overlay shown during this scene.
 * @property {string[]} assetRequirements - Assets needed to produce this scene.
 */

/**
 * A production-ready storyboard for an Instagram video.
 * @typedef {Object} Storyboard
 * @property {StoryboardScene[]} scenes - The storyboard's scenes, in order.
 */

export {};
