import ExperimentResult from "../../../models/experimentResult.model.js";

/**
 * @file BusinessEvaluationService — combines a statistical result with
 * cost/revenue inputs into a business-level verdict.
 *
 * Per the roadmap's Section 20: statistical significance alone isn't
 * enough — a statistically credible result can still be a bad business
 * decision if its cost is disproportionate. This decision is made
 * deterministically here, matching every other decision-making service
 * in this pipeline (StatisticalEvaluationService, AssignmentService) —
 * no LLM judgment call decides whether a win is "worth it".
 */

/**
 * Evaluates the business impact of an experiment's statistical result.
 * @param {Object} params
 * @param {Object} params.statisticalResult - Output of StatisticalEvaluationService.calculateSignificance().
 * @param {string} params.resultState - Output of StatisticalEvaluationService.determineResultState().
 * @param {number} [params.controlCost] - Cost associated with the control arm.
 * @param {number} [params.variantCost] - Cost associated with the variant arm.
 * @param {number} [params.estimatedRevenueImpact] - Estimated revenue impact, if known.
 * @returns {{ businessImpact: "positive"|"neutral"|"negative", reasoning: string, costDelta: number|null, costDeltaPercentage: number|null }}
 */
export function evaluateBusinessImpact({
  statisticalResult,
  resultState,
  controlCost,
  variantCost,
  estimatedRevenueImpact
}) {
  if (resultState === "NO_CLEAR_DIFFERENCE" || resultState === "INCONCLUSIVE") {
    return {
      businessImpact: "neutral",
      reasoning:
        "No statistically significant effect was found, so no cost/benefit tradeoff applies.",
      costDelta: null,
      costDeltaPercentage: null
    };
  }

  const normalizedControlCost = controlCost || 0;
  const normalizedVariantCost = variantCost || 0;
  const costDelta = normalizedVariantCost - normalizedControlCost;
  const costDeltaPercentage =
    normalizedControlCost > 0 ? (costDelta / normalizedControlCost) * 100 : null;

  if (resultState === "CONTROL_SUPPORTED") {
    return {
      businessImpact: "negative",
      reasoning:
        "The variant underperformed the control on the primary metric; no cost justification is relevant.",
      costDelta,
      costDeltaPercentage
    };
  }

  // resultState === "VARIANT_SUPPORTED"
  let businessImpact;
  let reasoning;

  if (costDeltaPercentage !== null && costDeltaPercentage > 200) {
    businessImpact = "negative";
    reasoning = `The variant showed a statistically significant improvement, but its cost increased by ${costDeltaPercentage.toFixed(1)}%, which likely outweighs the metric gain. Statistical significance alone does not justify this change.`;
  } else if (costDeltaPercentage !== null && costDeltaPercentage > 50) {
    businessImpact = "neutral";
    reasoning = `The variant improved the primary metric, but cost increased by ${costDeltaPercentage.toFixed(1)}% — a meaningful tradeoff that should be reviewed before committing budget, not a clear win.`;
  } else if (costDeltaPercentage !== null) {
    businessImpact = "positive";
    reasoning = `The variant showed a statistically significant improvement in the primary metric with only a ${costDeltaPercentage.toFixed(1)}% cost change, which does not appear to outweigh the gain.`;
  } else {
    businessImpact = "positive";
    reasoning =
      "The variant showed a statistically significant improvement in the primary metric. No cost data was provided, so this verdict reflects statistical significance only — confirm cost before committing budget.";
  }

  return { businessImpact, reasoning, costDelta, costDeltaPercentage };
}
