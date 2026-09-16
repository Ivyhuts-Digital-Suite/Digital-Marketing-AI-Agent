import Hypothesis from "../../models/hypothesis.model.js";
import Experiment from "../../models/experiment.model.js";
import { designExperiment } from "./services/ExperimentDesignService.js";
import { calculateBaseline } from "./services/BaselineService.js";
import {
  calculateSignificance,
  determineResultState
} from "./services/StatisticalEvaluationService.js";
import { createLearningFromExperiment } from "./services/LearningService.js";

/**
 * @file ExperimentEngine — top-level orchestration for the
 * experimentation pipeline: Hypothesis → Design → Baseline → Statistics
 * → Learning.
 *
 * Per the roadmap's principle for the Experiment Engine — "coordinate
 * the process, but shouldn't make unsupported conclusions" — this
 * module performs no statistical or business judgment itself. Every
 * real decision (whether a result is significant, what the result state
 * is, what a learning says) is delegated to the service that owns it:
 * StatisticalEvaluationService decides significance and result state,
 * LearningService decides what gets written as a learning. This module
 * only sequences those calls and persists the Experiment's own
 * lifecycle state.
 */

/**
 * Creates a new proposed Hypothesis.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.statement
 * @param {string} [params.category]
 * @param {string} [params.independentVariable]
 * @param {string} [params.dependentMetric]
 * @param {string} [params.targetAudience]
 * @param {string} [params.channel]
 * @param {string} [params.contentType]
 * @param {string} [params.expectedDirection]
 * @param {string} [params.rationale]
 * @param {string} [params.createdBy="human"]
 * @param {string} [params.sourceAgentType]
 * @param {string} [params.confidence]
 * @returns {Promise<import("mongoose").Document>} The created Hypothesis.
 */
export async function createHypothesis({
  organizationId,
  statement,
  category,
  independentVariable,
  dependentMetric,
  targetAudience,
  channel,
  contentType,
  expectedDirection,
  rationale,
  createdBy = "human",
  sourceAgentType,
  confidence
}) {
  return Hypothesis.create({
    organizationId,
    statement,
    category,
    independentVariable,
    dependentMetric,
    targetAudience,
    channel,
    contentType,
    expectedDirection,
    rationale,
    createdBy,
    sourceAgentType,
    confidence,
    status: "proposed"
  });
}

/**
 * Designs and persists a new Experiment from a Hypothesis.
 * @param {Object} params
 * @param {string} params.hypothesisId
 * @param {*} params.controlValue
 * @param {*} params.variantValue
 * @param {number} [params.durationDays]
 * @param {number} [params.minimumSampleSize]
 * @returns {Promise<import("mongoose").Document|{ success: false, error: string }>}
 *   The created Experiment on success, or a failure object if the design itself failed.
 */
export async function createExperiment({
  hypothesisId,
  controlValue,
  variantValue,
  durationDays,
  minimumSampleSize
}) {
  const designResult = await designExperiment({
    hypothesisId,
    controlValue,
    variantValue,
    durationDays,
    minimumSampleSize
  });

  if (!designResult.success) {
    return { success: false, error: designResult.error };
  }

  const { design } = designResult;
  const hypothesis = await Hypothesis.findById(hypothesisId);

  const baselineResult = await calculateBaseline({
    organizationId: hypothesis.organizationId,
    metric: design.primaryMetric,
    channel: design.channel,
    lookbackDays: 28
  });

  return Experiment.create({
    organizationId: hypothesis.organizationId,
    name: `${design.objective} - Experiment`,
    hypothesisId,
    primaryMetric: design.primaryMetric,
    baseline: {
      metric: baselineResult.metric,
      value: baselineResult.value
    },
    // Experiment.status has no "designed" value — "draft" matches the
    // schema's own default and existing enum (draft/pending_approval/
    // approved/running/completed/cancelled).
    status: "draft"
  });
}

/**
 * Evaluates a completed experiment's measurements: runs the statistical
 * test, determines the result state, records a learning from it, and
 * marks the Experiment completed.
 * @param {Object} params
 * @param {string} params.experimentId
 * @param {number} params.controlConversions
 * @param {number} params.controlSampleSize
 * @param {number} params.variantConversions
 * @param {number} params.variantSampleSize
 * @param {number} [params.confidenceLevel]
 * @returns {Promise<Object>} The evaluation outcome.
 */
export async function evaluateExperiment({
  experimentId,
  controlConversions,
  controlSampleSize,
  variantConversions,
  variantSampleSize,
  confidenceLevel
}) {
  const result = calculateSignificance({
    controlConversions,
    controlSampleSize,
    variantConversions,
    variantSampleSize,
    confidenceLevel
  });

  if (!result.valid) {
    // Maps to the roadmap's INVALID result state — invalid input never
    // proceeds to a learning.
    return { success: false, error: result.error };
  }

  const resultState = determineResultState(result);

  const learningResult = await createLearningFromExperiment({
    experimentId,
    statisticalResult: result,
    resultState
  });

  // NO_CLEAR_DIFFERENCE is still a completed experiment, per the
  // roadmap — status update happens regardless of resultState.
  await Experiment.findByIdAndUpdate(experimentId, { status: "completed" });

  return {
    success: true,
    statisticalResult: result,
    resultState,
    learning: learningResult.learning
  };
}
