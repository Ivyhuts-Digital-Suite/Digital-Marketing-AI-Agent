/**
 * @file Simulated final video assembly.
 *
 * This is a simulated MVP placeholder — there is no real video encoding
 * library available yet, so assembleVideo just simulates the work and
 * returns a plausible FinalVideo shape. A future version needs a real
 * video encoding pipeline (e.g. ffmpeg-based, or a cloud video assembly
 * API) once actual scene assets exist to assemble. This service is
 * intentionally decoupled from any specific AI video provider per the
 * roadmap — it only knows how to combine already-generated
 * script/storyboard/asset/voice pieces into a final video, not how any
 * of those pieces were produced.
 */

const SIMULATED_ASSEMBLY_DELAY_MS = 200;

/**
 * Resolves after the given delay, to simulate real assembly work.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assembles a final video from a script, storyboard, chosen scene asset
 * methods, and an optional voiceover.
 * @param {import("../types/videoAssembly.types.js").AssemblyInput} input
 * @returns {Promise<import("../types/videoAssembly.types.js").FinalVideo>} The assembled video.
 */
export async function assembleVideo(input) {
  await wait(SIMULATED_ASSEMBLY_DELAY_MS);

  return {
    videoUrl: `https://mock-storage.example.com/video/${Date.now()}.mp4`,
    duration: input.videoScript.duration,
    sceneCount: input.storyboard.scenes.length,
    hasVoice: Boolean(input.voiceAsset),
    hasSubtitles: Boolean(
      input.videoScript.scenes.some((s) => s.onScreenText)
    ),
    hasBrandElements: input.assetSelections.some(
      (a) => a.method === "motion_graphics"
    ),
    assembledAt: new Date()
  };
}
