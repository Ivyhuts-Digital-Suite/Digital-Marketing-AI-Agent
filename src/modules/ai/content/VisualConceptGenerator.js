/**
 * @file Rule-based visual concept generator.
 *
 * This is an MVP placeholder, in the same spirit as ../orchestrator/Planner.js's
 * rule-based planning: it derives a VisualConcept directly from a
 * CreativeBrief's existing fields, with no AI model call. Per the
 * roadmap, a future version should let an AI model reason over the brief
 * for a more tailored concept — this module should be replaced or
 * augmented once that lands, the same way Planner.js is flagged.
 */

const VISUAL_APPROACH_BY_FORMAT = {
  carousel: "One major concept per slide",
  reel: "Sequential scene-driven storytelling",
  story: "Single-frame focused moments"
};

const DEFAULT_VISUAL_APPROACH = "Single unified visual statement";

const MAX_METAPHOR_WORDS = 5;

/**
 * Derives a short visual-metaphor phrase from a core message by taking
 * its first few words. This is a rough heuristic, not real summarization.
 * @param {string} [coreMessage]
 * @returns {string}
 */
function deriveVisualMetaphor(coreMessage) {
  if (!coreMessage) {
    return "Growth and clarity";
  }

  return coreMessage.split(/\s+/).slice(0, MAX_METAPHOR_WORDS).join(" ");
}

/**
 * Builds a VisualConcept for a piece of content using fixed, rule-based
 * logic derived from its CreativeBrief.
 * @param {*} creativeBrief - The CreativeBrief data to derive a concept from.
 * @returns {import("../types/graphicEngine.types.js").VisualConcept} The resulting visual concept.
 */
export function generateVisualConcept(creativeBrief) {
  return {
    style: creativeBrief.visualDirection?.style || "minimal professional",
    format: creativeBrief.format,
    visualApproach:
      VISUAL_APPROACH_BY_FORMAT[creativeBrief.format] ||
      DEFAULT_VISUAL_APPROACH,
    typography: "Bold headline hierarchy",
    brandIntegration: "Company colors and logo",
    visualMetaphor: deriveVisualMetaphor(creativeBrief.coreMessage)
  };
}
