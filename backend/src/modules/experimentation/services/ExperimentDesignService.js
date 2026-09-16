import Hypothesis from "../../../models/hypothesis.model.js";

/**
 * @file ExperimentDesignService — turns a Hypothesis into a concrete,
 * controlled experiment design.
 *
 * Per the roadmap's "isolate the variable you're testing" principle
 * (Section 8-9): a valid experiment changes exactly one thing between
 * control and variant. This service doesn't enforce that automatically —
 * it has no way to compare actual generated content for identity, and
 * doing so is a Content Studio / Variant Generator responsibility later.
 * What it does is document the constraint (via constraintsNote) so
 * whatever builds control/variant content downstream knows what
 * "controlled" means for this experiment.
 */

/**
 * Designs a controlled experiment from a Hypothesis.
 * @param {Object} params
 * @param {string} params.hypothesisId - The Hypothesis this experiment tests.
 * @param {*} params.controlValue - The control arm's value for the independent variable.
 * @param {*} params.variantValue - The variant arm's value for the independent variable.
 * @param {number} [params.durationDays=14] - How long the experiment should run.
 * @param {number} [params.minimumSampleSize=1000] - Minimum sample size per arm.
 * @returns {Promise<Object>} The design result.
 */
export async function designExperiment({
  hypothesisId,
  controlValue,
  variantValue,
  durationDays = 14,
  minimumSampleSize = 1000
}) {
  try {
    const hypothesis = await Hypothesis.findById(hypothesisId);
    if (!hypothesis) {
      return { success: false, error: "HYPOTHESIS_NOT_FOUND" };
    }

    if (
      controlValue === undefined ||
      controlValue === null ||
      variantValue === undefined ||
      variantValue === null ||
      controlValue === variantValue
    ) {
      return {
        success: false,
        error:
          "INVALID_CONTROL_VARIANT: control and variant must both be provided and must differ"
      };
    }

    return {
      success: true,
      design: {
        hypothesisId,
        objective: hypothesis.statement,
        independentVariable: hypothesis.independentVariable,
        control: { label: "control", value: controlValue },
        variant: { label: "variant", value: variantValue },
        primaryMetric: hypothesis.dependentMetric,
        targetAudience: hypothesis.targetAudience,
        channel: hypothesis.channel,
        contentType: hypothesis.contentType,
        durationDays,
        minimumSampleSize,
        successCriteria: `Primary metric (${hypothesis.dependentMetric}) shows a statistically significant ${hypothesis.expectedDirection} in variant vs control`,
        stoppingConditions: [
          `Minimum sample size of ${minimumSampleSize} reached per arm`,
          `Duration of ${durationDays} days elapsed`,
          "Statistically significant result detected (early stopping optional, not automatic)"
        ],
        constraintsNote:
          "All other content attributes (topic, audience, visual style, CTA, posting frequency, content length) must remain identical between control and variant except the independent variable being tested."
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
