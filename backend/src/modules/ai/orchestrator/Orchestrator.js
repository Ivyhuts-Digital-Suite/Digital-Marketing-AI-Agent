import { resolveIntent } from "./IntentResolver.js";
import { createPlan } from "./Planner.js";
import { buildContext } from "../context/ContextBuilder.js";
import executionEngine from "../runtime/ExecutionEngine.js";
import { createRun, completeRun, failRun } from "../runtime/AgentRunService.js";
import { logEvent } from "../runtime/Logger.js";
import { selectAgentForCapability } from "./AgentSelector.js";
import "../agents/registerAgents.js";
import "../models/registerModels.js";
import "../models/registerMediaProviders.js";
import "../models/registerVoiceProviders.js";

/**
 * @file Top-level orchestrator entry point.
 *
 * Ties together the full request flow per the roadmap's orchestrator
 * flow diagram:
 *
 *   Intent (IntentResolver) → Context (ContextBuilder) → Plan (Planner)
 *   → Execution (ExecutionEngine + AgentRegistry) → Response
 *
 * with the AgentRun record (AgentRunService) tracking the run throughout.
 */

/**
 * Resolves the executor for a plan step by looking up an agent registered
 * for that step's capability. Missing agents fail fast with a
 * non-retryable MISSING_DATA error rather than throwing synchronously,
 * so ExecutionEngine's normal error handling path takes care of it.
 * @param {import("../orchestrator/Planner.js").PlanStep} step - The step needing an executor.
 * @param {string} message - The original request message.
 * @param {*} creativeBrief - The creative brief for this run, if any.
 * @param {*} context - The context built for this run.
 * @returns {import("../runtime/ExecutionEngine.js").StepExecutor} An async executor for this step.
 */
function resolveExecutor(step, message, creativeBrief, context) {
  let agent;

  try {
    agent = selectAgentForCapability(step.capability);
  } catch {
    return async () => {
      throw {
        code: "MISSING_DATA",
        message: `No agent registered for capability "${step.capability}"`,
        retryable: false
      };
    };
  }

  return async () => agent.run({ step, message, creativeBrief }, context);
}

/**
 * Parameters for running the orchestrator.
 * @typedef {Object} RunAgentParams
 * @property {string} organizationId - Organization the request is scoped to.
 * @property {string} [userId] - User who made the request, if any.
 * @property {string} [companyId] - Company to pull context for, if any.
 * @property {string} message - The free-form request message.
 * @property {*} [creativeBrief] - The creative brief for this run, if any.
 */

/**
 * Runs the full orchestrator flow for a single request: resolves intent,
 * creates the AgentRun, builds context, plans, executes, and records the
 * outcome.
 * @param {RunAgentParams} params
 * @returns {Promise<Object>} The orchestration result.
 */
export async function runAgent({
  organizationId,
  userId,
  companyId,
  message,
  creativeBrief
}) {
  try {
    const intent = resolveIntent(message);

    const run = await createRun({
      organizationId,
      userId,
      agentType: "orchestrator",
      request: message,
      context: { intent }
    });

    logEvent(run._id, "run_started", { message });

    const context = await buildContext({ organizationId, companyId });

    logEvent(run._id, "context_built", {
      hasCompany: !!context.company,
      hasBrand: !!context.brand
    });

    const plan = createPlan(intent);

    logEvent(run._id, "plan_generated", {
      objective: plan.objective,
      stepCount: plan.steps.length
    });

    const executorResolver = (step) =>
      resolveExecutor(step, message, creativeBrief, context);

    const result = await executionEngine.executePlan(
      run._id,
      plan,
      executorResolver
    );

    if (result.success) {
      await completeRun(run._id, {
        output: { outputs: result.outputs },
        usage: {},
        cost: {}
      });

      logEvent(run._id, "run_completed", {
        outputCount: result.outputs.length
      });

      return {
        success: true,
        runId: run._id,
        intent,
        plan,
        outputs: result.outputs
      };
    }

    await failRun(run._id, {
      code: result.error?.code || "EXECUTION_FAILED",
      message: result.error?.message || "Plan execution failed"
    });

    logEvent(run._id, "run_failed", { error: result.error });

    return {
      success: false,
      runId: run._id,
      intent,
      plan,
      error: result.error
    };
  } catch (error) {
    console.error("runAgent failed:", error);

    return {
      success: false,
      error: { code: "ORCHESTRATOR_ERROR", message: error.message }
    };
  }
}
