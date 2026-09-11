/**
 * @file Rule-based planner — turns an intent into an AgentPlan.
 *
 * This is an MVP placeholder. Per the roadmap, planning should eventually
 * be AI-model-driven (a model reasons over the intent + context to produce
 * a dynamic, arbitrary-length plan). For now we hard-code the plan for the
 * handful of intents the MVP supports, as a straightforward, deterministic
 * stand-in — this module should be replaced or augmented once dynamic
 * planning lands.
 */

/**
 * A user or system request, already classified into an intent.
 * @typedef {Object} Intent
 * @property {string} primary - The primary intent, e.g. "create_marketing_strategy".
 * @property {string[]} [secondary] - Secondary intents alongside the primary one.
 * @property {Object<string, *>} [entities] - Entities extracted from the request.
 */

/**
 * A single step within an AgentPlan.
 * @typedef {Object} PlanStep
 * @property {number} stepNumber - The step's position in the plan.
 * @property {string} name - Human-readable step name.
 * @property {string} capability - Capability tag used to resolve an executor.
 * @property {number[]} [dependsOn] - stepNumbers that must complete before this one.
 */

/**
 * The plan produced for an intent.
 * @typedef {Object} AgentPlan
 * @property {string} objective - Readable description of what the plan accomplishes.
 * @property {PlanStep[]} steps - The steps to execute, in order.
 * @property {"low"|"medium"|"high"} estimatedComplexity - Rough sizing of the plan.
 */

/**
 * Turns "some_intent_name" into "Some intent name".
 * @param {string} intentName
 * @returns {string}
 */
function humanize(intentName) {
  return intentName.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Sizes a plan by its step count: 1 step is "low", 2-3 is "medium",
 * anything more is "high".
 * @param {number} stepCount
 * @returns {"low"|"medium"|"high"}
 */
function estimateComplexity(stepCount) {
  if (stepCount <= 1) {
    return "low";
  }

  if (stepCount <= 3) {
    return "medium";
  }

  return "high";
}

/**
 * Builds an AgentPlan for the given intent using fixed, rule-based logic.
 * @param {Intent} intent - The classified intent to plan for.
 * @returns {AgentPlan} The resulting plan.
 */
export function createPlan(intent) {
  let steps;

  switch (intent.primary) {
    case "create_marketing_strategy":
      steps = [
        {
          stepNumber: 1,
          name: "Analyze company",
          capability: "company_analysis"
        },
        {
          stepNumber: 2,
          name: "Create strategy",
          capability: "strategy",
          dependsOn: [1]
        },
        {
          stepNumber: 3,
          name: "Create content calendar",
          capability: "content",
          dependsOn: [2]
        }
      ];
      break;

    case "company_analysis":
      steps = [
        {
          stepNumber: 1,
          name: "Analyze company",
          capability: "company_analysis"
        }
      ];
      break;

    default:
      steps = [
        {
          stepNumber: 1,
          name: "Handle request",
          capability: intent.primary || "general"
        }
      ];
  }

  return {
    objective: humanize(intent.primary || "general request"),
    steps,
    estimatedComplexity: estimateComplexity(steps.length)
  };
}
