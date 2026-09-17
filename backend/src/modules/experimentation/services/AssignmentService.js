/**
 * @file AssignmentService — decides how an experiment's traffic/content
 * is split between control and variant.
 *
 * Per the roadmap's Section 16, this explicitly does NOT pretend organic
 * social experiments have the same statistical structure as randomized
 * ad experiments. Advertising/landing-page channels can randomize
 * individual users at the traffic-routing layer; organic channels
 * (Instagram, etc.) cannot — there, the valid design is comparing
 * matched cohorts of published content, not splitting an audience.
 */

const USER_LEVEL_RANDOMIZATION_TYPES = ["advertising", "landing_page"];

/**
 * Determines which assignment strategy applies to an experiment.
 * @param {Object} params
 * @param {string} params.channel
 * @param {string} params.experimentType
 * @returns {Object} The assignment strategy.
 */
export function determineAssignmentStrategy({ channel, experimentType }) {
  if (USER_LEVEL_RANDOMIZATION_TYPES.includes(experimentType)) {
    return {
      strategyType: "user_level_randomization",
      description:
        "Individual users/sessions are randomly assigned to control or variant at the traffic-routing layer.",
      controlAllocation: 50,
      variantAllocation: 50,
      note: "Requires ad platform or landing page infrastructure capable of true randomized split traffic — not yet implemented for any specific provider."
    };
  }

  return {
    strategyType: "content_cohort",
    description:
      "A matched set of control-arm content pieces and a matched set of variant-arm content pieces are published and compared as cohorts — individual audience members cannot be randomly split for organic content the way ad traffic can.",
    recommendedCohortSize: 5,
    note: "Per the roadmap: organic social experiments do not have the same statistical structure as randomized ad experiments. Cohort-level comparison, not user-level randomization, is the valid design here."
  };
}

/**
 * Checks whether an experiment's actual per-arm content count meets the
 * strategy's recommended cohort size. Not applicable to user-level
 * randomization, where cohort size has no meaning.
 * @param {Object} params
 * @param {Object} params.strategy - Output of determineAssignmentStrategy().
 * @param {number} params.actualVariantCount
 * @returns {{ valid: boolean, warning?: string }}
 */
export function validateCohortSize({ strategy, actualVariantCount }) {
  if (strategy.strategyType !== "content_cohort") {
    return { valid: true };
  }

  if (actualVariantCount < strategy.recommendedCohortSize) {
    return {
      valid: false,
      warning: `Only ${actualVariantCount} content pieces per arm — recommended minimum is ${strategy.recommendedCohortSize} for a meaningful content cohort comparison. Results may be noisier than a properly-sized cohort.`
    };
  }

  return { valid: true };
}
