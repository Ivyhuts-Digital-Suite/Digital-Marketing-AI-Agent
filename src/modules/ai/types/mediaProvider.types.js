/**
 * @file Type definitions for image/video generation providers.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A request to generate an image.
 * @typedef {Object} ImageGenerationRequest
 * @property {string} prompt - The prompt to generate from.
 * @property {{ width: number, height: number }} [dimensions] - Target dimensions.
 * @property {string} [style] - The visual style to generate in.
 */

/**
 * A generated image asset.
 * @typedef {Object} ImageResult
 * @property {string} imageUrl - Where the generated image file lives.
 * @property {number} width - Image width in pixels.
 * @property {number} height - Image height in pixels.
 */

/**
 * Generates an image for the given request.
 * @callback ImageGenerate
 * @param {ImageGenerationRequest} request - The image generation request.
 * @returns {Promise<ImageResult>} Resolves with the generated image.
 */

/**
 * An image provider interface used to generate images.
 * @typedef {Object} ImageProvider
 * @property {string} name - Unique, human-readable provider name.
 * @property {ImageGenerate} generate - Generates an image; returns a Promise.
 */

/**
 * A request to generate a video.
 * @typedef {Object} VideoGenerationRequest
 * @property {string} prompt - The prompt to generate from.
 * @property {number} [duration] - Target duration in seconds.
 * @property {string} [style] - The visual style to generate in.
 */

/**
 * A generated video asset.
 * @typedef {Object} VideoResult
 * @property {string} videoUrl - Where the generated video file lives.
 * @property {number} duration - Duration in seconds.
 */

/**
 * Generates a video for the given request.
 * @callback VideoGenerate
 * @param {VideoGenerationRequest} request - The video generation request.
 * @returns {Promise<VideoResult>} Resolves with the generated video.
 */

/**
 * A video provider interface used to generate videos.
 * @typedef {Object} VideoProvider
 * @property {string} name - Unique, human-readable provider name.
 * @property {VideoGenerate} generate - Generates a video; returns a Promise.
 */

export {};
