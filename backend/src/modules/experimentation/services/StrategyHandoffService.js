import Recommendation from "../../../models/recommendation.model.js";
import AgentLearning from "../../../models/agentLearning.model.js";

/**
 * @file StrategyHandoffService — the "Strategy Intelligence" hand-off
 * point, per Section 26 of the roadmap:
 *
 *   Experiment → Learning → Strategy Intelligence → Strategy Agent → Strategy Version
 *
 * This module turns a Learning into a Recommendation for the Strategy
 * module to evaluate and act on independently — it never writes to the
 * Strategy/StrategyVersion collections directly, preserving the
 * existing strategy versioning system's integrity (see
 * backend/src/modules/strategy/strategy.schema.ts). Whether/how a
 * proposed change actually becomes a new StrategyVersion is entirely up
 * to that module's own approval + generation flow, not this one.
 *
 * Known gap: Recommendation.type is an enum that doesn't yet include
 * "strategy" as a value (only content/campaign/budget/audience/
 * creative/seo/conversion/channel/technical exist today). Until that
 * enum is extended, calling this with category: "strategy" will fail
 * Mongoose validation — surfaced here as a normal { success: false,
 * error } rather than an uncaught exception, not silently worked around.
 */

const MINIMUM_CONFIDENCE = 0.7; // "moderate" or higher, per LearningService.js's qualitative confidence tiers

/**
 * Proposes a Recommendation for the Strategy module based on a
 * sufficiently-confident AgentLearning. Does not touch Strategy or
 * StrategyVersion directly.
 * @param {Object} params
 * @param {string} params.learningId
 * @param {string} params.category - Mapped to Recommendation.type.
 * @param {string} [params.reasoning] - Defaults to the learning's own statement if omitted.
 * @returns {Promise<Object>} { success: true, recommendation } or { success: false, error }.
 */
export async function proposeStrategyChangeFromLearning({ learningId, category, reasoning }) {
  try {
    const learning = await AgentLearning.findById(learningId);
    if (!learning) {
      return { success: false, error: "LEARNING_NOT_FOUND" };
    }

    if (typeof learning.confidence !== "number" || learning.confidence < MINIMUM_CONFIDENCE) {
      return { success: false, error: "INSUFFICIENT_CONFIDENCE" };
    }

    const recommendation = await Recommendation.create({
      organizationId: learning.organizationId,
      type: category,
      title: "Strategy update suggested by experiment learning",
      description: learning.statement,
      reasoning: reasoning || learning.statement,
      evidence: [
        {
          metric: learning.impact?.metric,
          sourceId: learning._id
        }
      ],
      proposedAction: {
        // Placeholder — the Strategy module's real update tool/endpoint
        // hasn't been integrated yet. This names the action generically
        // for a human or the Strategy Agent to interpret and act on
        // independently, per the "propose, don't overwrite" boundary.
        tool: "review_strategy_update_from_learning",
        parameters: {
          learningId: learning._id,
          statement: learning.statement,
          applicableTo: learning.applicableTo,
          impact: learning.impact
        }
      },
      expectedImpact: {
        metric: learning.impact?.metric,
        estimatedChange: learning.impact?.percentageChange,
        confidence: learning.confidence
      }
    });

    return { success: true, recommendation };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
