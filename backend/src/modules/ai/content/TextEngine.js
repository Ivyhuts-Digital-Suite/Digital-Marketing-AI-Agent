import modelFactory from "../models/ModelFactory.js";

/**
 * @file Instagram text generation engine.
 *
 * Turns a CreativeBrief into format-specific text output (post, carousel,
 * reel, story) by prompting an AIModel and reshaping its response to
 * match the corresponding typedef in ../types/textEngine.types.js.
 */

/**
 * Builds the prompt sent to the model, summarizing the creative brief.
 * @param {*} creativeBrief - The CreativeBrief data (already fetched by the caller).
 * @returns {string} The prompt text.
 */
function buildPrompt(creativeBrief) {
  return [
    `Format: ${creativeBrief.format}`,
    `Core message: ${creativeBrief.coreMessage}`,
    `Hook: ${creativeBrief.hook}`,
    `Audience: ${creativeBrief.audience}`,
    `Call to action: ${creativeBrief.cta}`,
    `Emotional tone: ${creativeBrief.emotionalTone}`
  ].join("\n");
}

/**
 * Shapes the model's raw output into the structure for the given format.
 * @param {string} format - "post"|"carousel"|"reel"|"story".
 * @param {*} creativeBrief - The CreativeBrief data.
 * @param {import("../types/model.types.js").AIModelResult} result - The model's raw result.
 * @returns {import("../types/textEngine.types.js").PostOutput|
 *   import("../types/textEngine.types.js").CarouselOutput|
 *   import("../types/textEngine.types.js").ReelOutput|
 *   import("../types/textEngine.types.js").StoryOutput} The format-shaped output.
 */
function shapeOutput(format, creativeBrief, result) {
  switch (format) {
    case "post":
      return {
        hook: creativeBrief.hook,
        caption: result.text,
        cta: creativeBrief.cta,
        hashtags: []
      };

    case "carousel":
      return {
        slides: [
          { slideNumber: 1, text: creativeBrief.hook },
          { slideNumber: 2, text: result.text },
          { slideNumber: 3, text: creativeBrief.cta }
        ],
        caption: result.text,
        hashtags: []
      };

    case "reel":
      return {
        hook: creativeBrief.hook,
        script: result.text,
        onScreenText: creativeBrief.coreMessage || "",
        cta: creativeBrief.cta,
        caption: result.text
      };

    case "story":
      return {
        frames: [
          { frameNumber: 1, text: creativeBrief.hook },
          { frameNumber: 2, text: result.text }
        ],
        interaction: "",
        cta: creativeBrief.cta
      };

    default:
      throw new Error(`Unsupported format: "${format}"`);
  }
}

/**
 * Generates format-specific Instagram text content from a creative brief.
 * @param {import("../types/textEngine.types.js").TextGenerationRequest & { creativeBrief: *, modelProvider?: string }} request
 * @returns {Promise<{
 *   output: import("../types/textEngine.types.js").PostOutput|
 *     import("../types/textEngine.types.js").CarouselOutput|
 *     import("../types/textEngine.types.js").ReelOutput|
 *     import("../types/textEngine.types.js").StoryOutput,
 *   usage: import("../types/model.types.js").AIModelUsage
 * }>} The generated, format-shaped output plus the model's token usage.
 */
export async function generateText(request) {
  const { creativeBrief } = request;

  const prompt = buildPrompt(creativeBrief);

  const model = modelFactory.get(request.modelProvider || "mock");
  const result = await model.generate({ prompt });

  return {
    output: shapeOutput(request.format, creativeBrief, result),
    usage: result.usage
  };
}
