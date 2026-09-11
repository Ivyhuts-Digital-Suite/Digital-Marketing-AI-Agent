/**
 * @file Keyword-based intent resolver — turns a raw request message into
 * an AgentIntent.
 *
 * This is an MVP placeholder. Per the roadmap, intent resolution should
 * eventually be AI-model-driven (a model classifies the request, handles
 * paraphrasing/synonyms, and extracts entities). For now we do a simple
 * keyword match against a small, fixed set of intents — this module
 * should be replaced or augmented once model-driven classification lands.
 */

/**
 * A resolved intent, as consumed by Planner.createPlan.
 * @typedef {Object} AgentIntent
 * @property {string} primary - The primary intent, e.g. "create_marketing_strategy".
 * @property {number} confidence - Confidence score in [0, 1] for this classification.
 */

/**
 * Resolves a raw request message into an intent using keyword matching.
 * @param {string} requestMessage - The user's or caller's free-form request.
 * @returns {AgentIntent} The resolved intent.
 */
export function resolveIntent(requestMessage) {
  const message = requestMessage.toLowerCase();

  const mentionsStrategy = message.includes("strategy");
  const mentionsCreateVerb =
    message.includes("create") ||
    message.includes("make") ||
    message.includes("build");

  if (mentionsStrategy && mentionsCreateVerb) {
    return { primary: "create_marketing_strategy", confidence: 0.7 };
  }

  if (message.includes("analyze") && message.includes("company")) {
    return { primary: "company_analysis", confidence: 0.7 };
  }

  return { primary: "general_request", confidence: 0.3 };
}
