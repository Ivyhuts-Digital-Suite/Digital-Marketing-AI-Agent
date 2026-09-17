/**
 * @file AutonomyPolicyService — defines risk classification for
 * experiments, per Section 34-35: "Initially, I would keep experiments
 * human-approved."
 *
 * This service classifies risk, but does NOT decide whether to
 * auto-approve anything. requiresApproval is always true today,
 * regardless of riskLevel — see the prominent note on
 * classifyExperimentRisk() for why, and what would need to exist before
 * that could ever change.
 */

const HIGH_RISK_KEYWORDS = ["budget", "spend", "bid"];
const MEDIUM_RISK_KEYWORDS = ["content mix", "posting frequency", "campaign strategy"];

/**
 * Classifies an experiment's risk level from its independent variable
 * and type, via simple keyword/type matching — no ML, no LLM judgment.
 *
 * IMPORTANT: requiresApproval is ALWAYS true here, regardless of
 * riskLevel. This is deliberate, per the roadmap's own guidance to
 * start conservative: there is no organization-level opt-in mechanism
 * for auto-executing low-risk experiments (no such field exists on
 * OrganizationSettings, and none should be speculatively added here).
 * A future version could set requiresApproval conditionally — e.g.
 * `riskLevel === "low" && organization.settings.autoApproveLowRiskExperiments`
 * — once that capability actually exists. Until then, every experiment,
 * regardless of how low-risk it's classified, requires a human to
 * approve it (see ExperimentEngine.approveExperiment).
 *
 * @param {Object} params
 * @param {string} params.independentVariable
 * @param {string} params.experimentType
 * @returns {{ riskLevel: "low"|"medium"|"high", requiresApproval: true, reasoning: string }}
 */
export function classifyExperimentRisk({ independentVariable, experimentType }) {
  const normalizedVariable = (independentVariable || "").toLowerCase();

  if (experimentType === "advertising") {
    const matchedKeyword = HIGH_RISK_KEYWORDS.find((keyword) =>
      normalizedVariable.includes(keyword)
    );
    if (matchedKeyword) {
      return {
        riskLevel: "high",
        requiresApproval: true,
        reasoning: `Advertising experiments involving "${matchedKeyword}" directly affect spend and are classified high-risk.`
      };
    }
  }

  if (experimentType === "content") {
    const matchedKeyword = MEDIUM_RISK_KEYWORDS.find((keyword) =>
      normalizedVariable.includes(keyword)
    );
    if (matchedKeyword) {
      return {
        riskLevel: "medium",
        requiresApproval: true,
        reasoning: `Content experiments involving "${matchedKeyword}" affect broader content strategy and are classified medium-risk.`
      };
    }
  }

  return {
    riskLevel: "low",
    requiresApproval: true,
    reasoning: `"${independentVariable}" does not match any known high- or medium-risk pattern for a "${experimentType}" experiment; classified low-risk by default.`
  };
}
