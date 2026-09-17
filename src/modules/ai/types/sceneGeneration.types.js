/**
 * @file Type definitions for scene asset method selection.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * The chosen production method for generating/sourcing a scene's asset.
 * @typedef {Object} AssetSelection
 * @property {number} sceneNumber - The storyboard scene this selection is for.
 * @property {"ai_video"|"image_animation"|"product_footage"|"motion_graphics"|"stock_footage"} method - The chosen production method.
 * @property {string} reason - Why this method was chosen.
 */

export {};
