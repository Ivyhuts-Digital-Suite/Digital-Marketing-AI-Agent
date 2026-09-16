import { createHypothesis, createExperiment, evaluateExperiment } from "./ExperimentEngine.js";

/**
 * @file ExperimentationAgent — the agent-facing entry point into the
 * experimentation pipeline.
 *
 * Matching CampaignAgent's shape: this agent is a pure dispatcher. It
 * routes an action to the matching ExperimentEngine function and
 * returns whatever that function produces, unmodified — it never
 * inspects or re-interprets a success/error shape, never decides
 * significance, and never writes a learning's content itself. All of
 * that judgment already lives in ExperimentEngine's own services.
 */

const ExperimentationAgent = {
  name: "ExperimentationAgent",
  description:
    "Manages the experimentation pipeline: creating hypotheses, designing experiments, and evaluating results into learnings — delegates all statistical/business judgment to ExperimentEngine's services, never makes a conclusion itself.",
  capabilities: ["create_hypothesis", "run_experiment", "evaluate_experiment"],

  async run(input, context) {
    const action = input.action || input.step?.action;
    if (!action) {
      throw {
        code: "MISSING_DATA",
        message: "ExperimentationAgent requires an action to know which experimentation step to perform",
        retryable: false
      };
    }

    const params = input.params || input.step?.params || {};

    switch (action) {
      case "create_hypothesis":
        return await createHypothesis(params);

      case "run_experiment":
        return await createExperiment(params);

      case "evaluate_experiment":
        return await evaluateExperiment(params);

      default:
        throw {
          code: "MISSING_DATA",
          message: `Unknown action "${action}" for ExperimentationAgent`,
          retryable: false
        };
    }
  }
};

export default ExperimentationAgent;
