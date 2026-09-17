import AgentLearning from "../../../models/agentLearning.model.js";
import Experiment from "../../../models/experiment.model.js";
import Hypothesis from "../../../models/hypothesis.model.js";

/**
 * @file MarketingMemoryService — the "marketing memory" layer: retrieving
 * prior learnings related to a new one, and detecting when evidence is
 * mixed rather than letting a new positive result silently overwrite
 * prior contradictory findings.
 *
 * Per Section 28: "the system should not assume every experiment
 * reinforces previous knowledge." This service is what lets a new
 * learning be evaluated against prior evidence rather than treated as
 * the first/only data point, making the knowledge base trustworthy
 * rather than overconfident from a single experiment.
 *
 * Hypothesis is imported alongside AgentLearning/Experiment — a
 * learning's independent variable lives only on its Experiment's
 * Hypothesis (Experiment itself has no such field), so finding related
 * learnings by independentVariable requires this second hop.
 */

/**
 * Finds prior AgentLearnings related to a channel/contentType/independent
 * variable combination, via direct model queries joined in application
 * code (matching this codebase's established simple-query style, rather
 * than a complex aggregation).
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} [params.channel]
 * @param {string} [params.contentType]
 * @param {string} [params.independentVariable]
 * @returns {Promise<Array>} Matching learnings, newest first.
 */
export async function findRelatedLearnings({
  organizationId,
  channel,
  contentType,
  independentVariable
}) {
  const query = { organizationId };

  if (channel && contentType) {
    query.$or = [
      { "applicableTo.channels": channel },
      { "applicableTo.contentTypes": contentType }
    ];
  } else if (channel) {
    query["applicableTo.channels"] = channel;
  } else if (contentType) {
    query["applicableTo.contentTypes"] = contentType;
  }

  const learnings = await AgentLearning.find(query).sort({ createdAt: -1 });

  if (!independentVariable) {
    return learnings;
  }

  const experimentIds = learnings.map((learning) => learning.experimentId).filter(Boolean);
  const experiments = await Experiment.find({ _id: { $in: experimentIds } });
  const experimentById = new Map(
    experiments.map((experiment) => [experiment._id.toString(), experiment])
  );

  const hypothesisIds = experiments.map((experiment) => experiment.hypothesisId).filter(Boolean);
  const hypotheses = await Hypothesis.find({ _id: { $in: hypothesisIds } });
  const hypothesisById = new Map(
    hypotheses.map((hypothesis) => [hypothesis._id.toString(), hypothesis])
  );

  return learnings.filter((learning) => {
    if (!learning.experimentId) {
      return false;
    }

    const experiment = experimentById.get(learning.experimentId.toString());
    if (!experiment || !experiment.hypothesisId) {
      return false;
    }

    const hypothesis = hypothesisById.get(experiment.hypothesisId.toString());
    return hypothesis?.independentVariable === independentVariable;
  });
}

/**
 * Assesses whether a set of prior learnings agree with each other.
 * @param {Array} learnings - AgentLearning documents, each with an optional impact.percentageChange.
 * @returns {{ consistency: "no_prior_evidence"|"mixed"|"consistent_positive"|"consistent_negative"|"inconclusive", positiveCount: number, negativeCount: number, neutralCount: number, summary: string }}
 */
export function assessEvidenceConsistency(learnings) {
  if (learnings.length === 0) {
    return {
      consistency: "no_prior_evidence",
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      summary:
        "No prior learnings exist for this variable/channel combination. This would be the first experiment."
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  for (const learning of learnings) {
    const change = learning.impact?.percentageChange;
    if (change > 0) {
      positiveCount += 1;
    } else if (change < 0) {
      negativeCount += 1;
    } else {
      neutralCount += 1;
    }
  }

  let consistency;
  if (positiveCount > 0 && negativeCount > 0) {
    consistency = "mixed";
  } else if (positiveCount > 0 && negativeCount === 0) {
    consistency = "consistent_positive";
  } else if (negativeCount > 0 && positiveCount === 0) {
    consistency = "consistent_negative";
  } else {
    consistency = "inconclusive";
  }

  let summary;
  if (consistency === "mixed") {
    summary = `Evidence is mixed: ${positiveCount} prior experiment(s) showed a positive effect, ${negativeCount} showed a negative effect${
      neutralCount > 0 ? `, and ${neutralCount} showed no clear effect` : ""
    }. Possible moderating factors to consider: audience, topic, season, content format.`;
  } else if (consistency === "consistent_positive") {
    summary = `${positiveCount} prior experiment(s) consistently showed a positive effect, with no contradicting results.`;
  } else if (consistency === "consistent_negative") {
    summary = `${negativeCount} prior experiment(s) consistently showed a negative effect, with no contradicting results.`;
  } else {
    summary = `${neutralCount} prior experiment(s) showed no clear effect.`;
  }

  return { consistency, positiveCount, negativeCount, neutralCount, summary };
}
