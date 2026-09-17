/**
 * @file Type definitions for final video assembly.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * Everything needed to assemble a final video for a piece of content.
 * @typedef {Object} AssemblyInput
 * @property {import("./videoEngine.types.js").VideoScript} videoScript - The video's script.
 * @property {import("./videoEngine.types.js").Storyboard} storyboard - The video's storyboard.
 * @property {import("./sceneGeneration.types.js").AssetSelection[]} assetSelections - Chosen production method per scene.
 * @property {import("./audio.types.js").VoiceAsset} [voiceAsset] - The voiceover asset, if any.
 * @property {*} creativeBrief - The CreativeBrief the video was generated from.
 */

/**
 * The assembled, final video output.
 * @typedef {Object} FinalVideo
 * @property {string} videoUrl - Where the assembled video file lives.
 * @property {number} duration - Duration in seconds.
 * @property {number} sceneCount - Number of scenes in the assembled video.
 * @property {boolean} hasVoice - Whether the video includes a voiceover.
 * @property {boolean} hasSubtitles - Whether the video includes on-screen text.
 * @property {boolean} hasBrandElements - Whether the video includes branded motion graphics.
 * @property {Date} assembledAt - When assembly completed.
 */

export {};
