import AgentLearning from "../../../models/agentLearning.model.js";
import Experiment from "../../../models/experiment.model.js";
import Hypothesis from "../../../models/hypothesis.model.js";
import ExperimentVariant from "../../../models/experimentVariant.model.js";

/**
 * @file LearningService — turns a completed experiment's statistical
 * result into a persisted AgentLearning.
 *
 * Per the roadmap:
 *   - Section 24 (scope requirement): every learning must carry an
 *     applicableTo scope (channels/contentTypes here) and must never be
 *     presented as a universal rule — it only applies within the scope
 *     it was actually tested in.
 *   - Section 26 ("don't overwrite strategy directly"): this service's
 *     job stops at creating a Learning. Feeding a learning into Strategy
 *     (updating playbooks, defaults, future plans) is a separate, later
 *     step this file does not perform.
 *
 * ExperimentVariant is imported (beyond the model set this service was
 * originally scoped to) specifically to read each variant's
 * `configuration` — the actual tested value — rather than fabricate
 * placeholder text for a statement that gets persisted as a business
 * fact.
 */

const CONFIDENCE_BY_REPLICATION = {
  limited: 0.4,
  moderate: 0.7,
  strong: 0.9
};

/**
 * Produces a short human-readable label for a variant's tested value.
 * @param {*} variant
 * @returns {string}
 */
function describeVariantValue(variant) {
  if (!variant) {
    return "(unspecified)";
  }

  const { configuration } = variant;
  if (typeof configuration === "string" && configuration.trim()) {
    return configuration;
  }
  if (configuration && typeof configuration === "object") {
    return JSON.stringify(configuration);
  }

  return variant.description || variant.name || "(unspecified)";
}

/**
 * Maps a replication count (how many other completed experiments have
 * tested the same independent variable on the same channel) to a
 * qualitative confidence label and its numeric equivalent.
 * @param {number} priorCount
 * @returns {{ label: "limited"|"moderate"|"strong", numeric: number }}
 */
function qualitativeConfidenceFor(priorCount) {
  let label;
  if (priorCount >= 3) {
    label = "strong";
  } else if (priorCount >= 1) {
    label = "moderate";
  } else {
    label = "limited";
  }

  return { label, numeric: CONFIDENCE_BY_REPLICATION[label] };
}

/**
 * Creates an AgentLearning from a completed experiment's statistical
 * result.
 * @param {Object} params
 * @param {string} params.experimentId
 * @param {Object} params.statisticalResult - Output of StatisticalEvaluationService.calculateSignificance().
 * @param {string} params.resultState - Output of StatisticalEvaluationService.determineResultState().
 * @returns {Promise<Object>} { success: true, learning } or { success: false, error }.
 */
export async function createLearningFromExperiment({
  experimentId,
  statisticalResult,
  resultState
}) {
  try {
    const experiment = await Experiment.findById(experimentId);
    const hypothesis = experiment
      ? await Hypothesis.findById(experiment.hypothesisId)
      : null;

    if (!experiment || !hypothesis) {
      return { success: false, error: "EXPERIMENT_OR_HYPOTHESIS_NOT_FOUND" };
    }

    const isInconclusive =
      resultState === "NO_CLEAR_DIFFERENCE" || resultState === "INCONCLUSIVE";

    const variants = await ExperimentVariant.find({ experimentId });
    const controlVariant = variants.find((v) => v.type === "control");
    const variantVariant = variants.find((v) => v.type === "variant");
    const controlValue = describeVariantValue(controlVariant);
    const variantValue = describeVariantValue(variantVariant);

    let statement;

    if (isInconclusive) {
      statement = `No statistically significant difference was found between ${controlValue} and ${variantValue} for ${hypothesis.independentVariable} on ${hypothesis.dependentMetric}.`;
    } else {
      const variantWins = resultState === "VARIANT_SUPPORTED";
      const winningLabel = variantWins ? "Variant" : "Control";
      const losingLabel = variantWins ? "control" : "variant";
      const winningValue = variantWins ? variantValue : controlValue;
      const losingValue = variantWins ? controlValue : variantValue;

      if (statisticalResult.relativeEffect === null) {
        // controlRate was 0 in calculateSignificance, so no percentage
        // change is meaningful — report the effect without one.
        statement = `${winningLabel} (${winningValue}) showed a measurable improvement in ${hypothesis.dependentMetric} compared to ${losingLabel} (${losingValue}) for ${hypothesis.targetAudience} on ${hypothesis.channel} (baseline rate was zero, so a percentage change could not be calculated).`;
      } else {
        const direction = statisticalResult.relativeEffect >= 0 ? "increase" : "decrease";

        statement = `${winningLabel} (${winningValue}) generated ${Math.abs(statisticalResult.relativeEffect * 100).toFixed(1)}% ${direction} in ${hypothesis.dependentMetric} compared to ${losingLabel} (${losingValue}) for ${hypothesis.targetAudience} on ${hypothesis.channel}.`;
      }
    }

    // Replication count proxy: other completed experiments testing the
    // same independent variable on the same channel for this org.
    const matchingHypothesisIds = await Hypothesis.find({
      organizationId: experiment.organizationId,
      independentVariable: hypothesis.independentVariable,
      channel: hypothesis.channel
    }).distinct("_id");

    const priorCount = await Experiment.countDocuments({
      _id: { $ne: experiment._id },
      organizationId: experiment.organizationId,
      status: "completed",
      hypothesisId: { $in: matchingHypothesisIds }
    });

    const { label: qualitativeConfidence, numeric: confidence } =
      qualitativeConfidenceFor(priorCount);

    const learning = await AgentLearning.create({
      organizationId: experiment.organizationId,
      category: hypothesis.category || "content",
      statement,
      evidence: [
        {
          type: "experiment_result",
          sourceId: experimentId,
          value: {
            resultState,
            effectSize: statisticalResult.effectSize,
            relativeEffect: statisticalResult.relativeEffect,
            pValue: statisticalResult.pValue,
            confidenceLevel: statisticalResult.confidenceLevel,
            qualitativeConfidence
          }
        }
      ],
      confidence,
      impact: isInconclusive
        ? undefined
        : {
            metric: hypothesis.dependentMetric,
            value: statisticalResult.effectSize,
            percentageChange: statisticalResult.relativeEffect * 100
          },
      experimentId,
      applicableTo: {
        channels: [hypothesis.channel].filter(Boolean),
        contentTypes: [hypothesis.contentType].filter(Boolean)
      },
      status: "candidate"
    });

    experiment.learningIds.push(learning._id);
    await experiment.save();

    return { success: true, learning };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
