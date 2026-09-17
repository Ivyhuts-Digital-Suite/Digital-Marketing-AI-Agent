import { generateText } from "../content/TextEngine.js";
import { generateVisualConcept } from "../content/VisualConceptGenerator.js";
import { buildDesignSpecification } from "../content/DesignSpecBuilder.js";
import { generateScript } from "../content/ScriptGenerator.js";
import { buildStoryboard } from "../content/StoryboardGenerator.js";
import { selectAssetMethodsForStoryboard } from "../content/SceneAssetSelector.js";
import voiceProviderFactory from "../models/VoiceProviderFactory.js";
import { assembleVideo } from "../content/VideoAssemblyService.js";
import {
  validateTextContent,
  validateVideoContent
} from "../content/BrandValidator.js";

/**
 * @file ContentStudioAgent — the agent that turns a CreativeBrief into
 * finished Instagram content.
 *
 * For "reel" briefs it runs the video pipeline (script → storyboard →
 * scene asset selection → voiceover → assembly → validation). For every
 * other format ("post", "carousel", "story") it runs the text pipeline
 * (text generation → visual concept → design spec → validation).
 */

/**
 * @type {import("../types/agent.types.js").Agent}
 */
const ContentStudioAgent = {
  name: "ContentStudioAgent",
  description:
    "Generates Instagram text, graphic specs, and video content from a CreativeBrief",
  capabilities: ["content", "instagram_content", "creative_brief_execution"],

  async run(input, context) {
    const creativeBrief = input.creativeBrief || input.step?.creativeBrief;
    if (!creativeBrief) {
      throw {
        code: "MISSING_DATA",
        message: "ContentStudioAgent requires a creativeBrief",
        retryable: false
      };
    }

    if (creativeBrief.format === "reel") {
      const { output: script } = await generateScript(creativeBrief);
      const visualConcept = generateVisualConcept(creativeBrief);
      const storyboard = buildStoryboard(script, visualConcept);
      const assetSelections = selectAssetMethodsForStoryboard(storyboard);
      const voiceAsset = await voiceProviderFactory
        .get("mock")
        .generateVoice({ text: script.hook, duration: script.duration });

      const finalVideo = await assembleVideo({
        videoScript: script,
        storyboard,
        assetSelections,
        voiceAsset,
        creativeBrief
      });

      const validation = validateVideoContent(finalVideo, creativeBrief);

      return {
        type: "video",
        script,
        visualConcept,
        storyboard,
        assetSelections,
        voiceAsset,
        finalVideo,
        validation
      };
    }

    const { output: textOutput, usage } = await generateText({
      format: creativeBrief.format,
      creativeBrief
    });

    const visualConcept = generateVisualConcept(creativeBrief);
    const designSpecification = buildDesignSpecification(
      visualConcept,
      creativeBrief
    );

    const validation = validateTextContent(textOutput, creativeBrief);

    return {
      type: "text",
      textOutput,
      usage,
      visualConcept,
      designSpecification,
      validation
    };
  }
};

export default ContentStudioAgent;
