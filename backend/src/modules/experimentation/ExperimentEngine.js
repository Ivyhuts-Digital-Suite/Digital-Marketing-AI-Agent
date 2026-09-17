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
    status: "designed"
  });
}

/**
 * Approves a designed (or previously pending) Experiment so it can be
 * scheduled.
 * @param {string} experimentId
 * @returns {Promise<Object>} { success: true, experiment } or { success: false, error }.
 */
export async function approveExperiment(experimentId) {
  const experiment = await Experiment.findById(experimentId);

  if (!["designed", "pending_approval"].includes(experiment.status)) {
    return {
      success: false,
      error: `Cannot approve experiment in status "${experiment.status}"`
    };
  }

  experiment.status = "approved";
  await experiment.save();

  return { success: true, experiment };
}

/**
 * Schedules an approved Experiment for a start/end window.
 * @param {Object} params
 * @param {string} params.experimentId
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @returns {Promise<Object>} { success: true, experiment } or { success: false, error }.
 */
export async function scheduleExperiment({ experimentId, startDate, endDate }) {
  const experiment = await Experiment.findById(experimentId);

  if (experiment.status !== "approved") {
    return {
      success: false,
      error: `Cannot schedule experiment in status "${experiment.status}"`
    };
  }

  experiment.status = "scheduled";
  experiment.startDate = startDate;
  experiment.endDate = endDate;
  await experiment.save();

  return { success: true, experiment };
}

/**
 * Starts a scheduled (or directly approved) Experiment.
 * @param {string} experimentId
 * @returns {Promise<Object>} { success: true, experiment } or { success: false, error }.
 */
export async function startExperiment(experimentId) {
  const experiment = await Experiment.findById(experimentId);

  if (!["scheduled", "approved"].includes(experiment.status)) {
    return {
      success: false,
      error: `Cannot start experiment in status "${experiment.status}"`
    };
  }

  experiment.status = "running";
  await experiment.save();

  return { success: true, experiment };
}

const TERMINAL_STATUSES = ["completed", "cancelled", "inconclusive", "invalid", "failed"];

/**
 * Cancels an Experiment that hasn't already reached a terminal status.
 *
 * Experiment has no notes/reason field, so `reason` isn't persisted
 * anywhere on the document today — only status is updated.
 * @param {Object} params
 * @param {string} params.experimentId
 * @param {string} [params.reason] - Accepted but not currently stored; see above.
 * @returns {Promise<Object>} { success: true, experiment } or { success: false, error }.
 */
export async function cancelExperiment({ experimentId, reason }) {
  const experiment = await Experiment.findById(experimentId);

  if (TERMINAL_STATUSES.includes(experiment.status)) {
    return {
      success: false,
      error: `Cannot cancel experiment already in terminal status "${experiment.status}"`
    };
  }

  experiment.status = "cancelled";
  await experiment.save();

  return { success: true, experiment };
}

/**
 * A "measuring"/"evaluating" intermediate transition isn't modeled as a
 * separate step here, since this codebase doesn't yet have a live
 * analytics feed that would make that transition meaningful.
 * evaluateExperiment() implicitly assumes the experiment was already
 * "running" and moves straight to a terminal state
 * (completed/inconclusive/invalid) once given results to evaluate.
 *
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
    await Experiment.findByIdAndUpdate(experimentId, { status: "invalid" });
    return { success: false, error: result.error };
  }

  const resultState = determineResultState(result);

  const learningResult = await createLearningFromExperiment({
    experimentId,
    statisticalResult: result,
    resultState
  });

  // Experiment status reflects the result state, not a single blanket
  // "completed" — NO_CLEAR_DIFFERENCE/INCONCLUSIVE are still valid,
  // informative outcomes, just not ones with a supported arm.
  const statusByResultState = {
    NO_CLEAR_DIFFERENCE: "inconclusive",
    INCONCLUSIVE: "inconclusive",
    VARIANT_SUPPORTED: "completed",
    CONTROL_SUPPORTED: "completed"
  };

  await Experiment.findByIdAndUpdate(experimentId, {
    status: statusByResultState[resultState]
  });

  return {
    success: true,
    statisticalResult: result,
    resultState,
    learning: learningResult.learning
  };
}
