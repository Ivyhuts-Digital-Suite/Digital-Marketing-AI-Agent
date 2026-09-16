import Hypothesis from "../../../models/hypothesis.model.js";

/**
 * @file HypothesisGeneratorService — turns a structured finding into a
 * testable Hypothesis.
 *
 * Per Section 6, this supports AI-generated hypotheses (alongside the
 * existing human-created path via ExperimentEngine.createHypothesis).
 * This is a deterministic, rule-based translation from a structured
 * finding to a testable statement, not an LLM call — matching the
 * roadmap's "never let the LLM perform statistical calculations" spirit
 * extended to hypothesis generation itself: the pattern-matching logic
 * here is explicit and auditable, not model-generated, in the same
 * spirit as the rule-based MVP placeholders elsewhere in this codebase
 * (Planner.js, VisualConceptGenerator.js, etc.).
 *
 * In production, Phase 11's Analytics/Optimization agents (not yet
 * built) would be the actual callers passing in `finding` objects —
 * this service doesn't listen for or discover findings itself.
 */

/**
 * Generates and persists a Hypothesis from an observed finding.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} [params.sourceAgentType]
 * @param {Object} params.finding - { metric, observation, possibleCause, channel, contentType, audience, category }
 * @returns {Promise<Object>} { success: true, hypothesis } or { success: false, error }.
 */
export async function generateHypothesisFromFinding({
  organizationId,
  sourceAgentType,
  finding
}) {
  try {
    if (!finding?.metric || !finding?.observation || !finding?.possibleCause) {
      return {
        success: false,
        error:
          "INCOMPLETE_FINDING: metric, observation, and possibleCause are required to generate a testable hypothesis"
      };
    }

    const statement = `${finding.possibleCause} affects ${finding.metric}${
      finding.channel ? ` on ${finding.channel}` : ""
    }${finding.audience ? ` for ${finding.audience}` : ""}.`;

    const hypothesis = await Hypothesis.create({
      organizationId,
      statement,
      category: finding.category || "content",
      independentVariable: finding.possibleCause,
      dependentMetric: finding.metric,
      targetAudience: finding.audience,
      channel: finding.channel,
      contentType: finding.contentType,
      expectedDirection: "increase",
      rationale: finding.observation,
      createdBy: "agent",
      sourceAgentType: sourceAgentType || "analytics",
      confidence: "medium",
      status: "proposed"
    });

    return { success: true, hypothesis };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
