/**
 * @file Type definitions for voice/audio generation providers.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A request to generate a voiceover.
 * @typedef {Object} VoiceRequest
 * @property {string} text - The text to voice.
 * @property {string} [voiceStyle] - The voice style/persona to use.
 * @property {number} [duration] - Target duration in seconds.
 */

/**
 * A generated voiceover asset.
 * @typedef {Object} VoiceAsset
 * @property {string} audioUrl - Where the generated audio file lives.
 * @property {number} duration - Duration in seconds.
 * @property {string} format - Audio file format (e.g. "mp3").
 */

/**
 * Generates a voiceover for the given input.
 * @callback VoiceGenerate
 * @param {VoiceRequest} input - The voiceover request.
 * @returns {Promise<VoiceAsset>} Resolves with the generated voice asset.
 */

/**
 * A voice/audio provider interface used to generate voiceovers.
 * @typedef {Object} VoiceProvider
 * @property {string} name - Unique, human-readable provider name.
 * @property {VoiceGenerate} generateVoice - Generates a voiceover; returns a Promise.
 */

export {};
