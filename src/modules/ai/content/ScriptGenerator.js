import modelFactory from "../models/ModelFactory.js";

/**
 * @file Instagram video script generator.
 *
 * This is an MVP placeholder, in the same spirit as ../orchestrator/Planner.js
 * and ./TextEngine.js: it prompts a mock-capable AIModel and naively
 * splits the response into a fixed 3-scene structure, rather than having
 * a model reason about pacing/scene breaks directly. A future version
 * should let the model (or a dedicated scene-planning step) produce the
 * scene breakdown itself.
 */

const DEFAULT_REEL_DURATION_SECONDS = 30;
const SCENE_COUNT = 3;
const SCENE_DURATION_SECONDS = 10;

/**
 * Builds the prompt sent to the model, summarizing the creative brief.
 * @param {*} creativeBrief - The CreativeBrief data.
 * @returns {string} The prompt text.
 */
function buildPrompt(creativeBrief) {
  return [
    `Hook: ${creativeBrief.hook}`,
    `Core message: ${creativeBrief.coreMessage}`,
    `Call to action: ${creativeBrief.cta}`,
    `Audience: ${creativeBrief.audience}`,
    `Emotional tone: ${creativeBrief.emotionalTone}`
  ].join("\n");
}

/**
 * Splits text into SCENE_COUNT roughly-equal word chunks. Falls back to
 * repeating the full text across every scene when there aren't enough
 * words to split meaningfully.
 * @param {string} text
 * @returns {string[]} Exactly SCENE_COUNT narration chunks.
 */
function splitIntoScenes(text) {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < SCENE_COUNT) {
    return Array(SCENE_COUNT).fill(text);
  }

  const chunkSize = Math.ceil(words.length / SCENE_COUNT);
  const chunks = [];

  for (let i = 0; i < SCENE_COUNT; i++) {
    chunks.push(
      words.slice(i * chunkSize, (i + 1) * chunkSize).join(" ")
    );
  }

  return chunks;
}

/**
 * Generates a VideoScript for an Instagram Reel from a creative brief.
 * @param {*} creativeBrief - The CreativeBrief data, plus an optional modelProvider.
 * @returns {Promise<{ output: import("../types/videoEngine.types.js").VideoScript, usage: import("../types/model.types.js").AIModelUsage }>}
 */
export async function generateScript(creativeBrief) {
  const prompt = buildPrompt(creativeBrief);

  const model = modelFactory.get(creativeBrief.modelProvider || "mock");
  const result = await model.generate({ prompt });

  const narrationChunks = splitIntoScenes(result.text);

  const scenes = narrationChunks.map((narration, index) => ({
    order: index + 1,
    duration: SCENE_DURATION_SECONDS,
    narration,
    onScreenText: "",
    visualDescription: "Generated from creative brief"
  }));

  const script = {
    hook: creativeBrief.hook,
    duration: DEFAULT_REEL_DURATION_SECONDS,
    scenes,
    cta: creativeBrief.cta
  };

  return { output: script, usage: result.usage };
}
