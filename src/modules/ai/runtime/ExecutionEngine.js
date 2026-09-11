import { shouldRetry, wait } from "./RetryManager.js";
import { validateOutput } from "../validation/Validator.js";
import { addStep } from "./AgentRunService.js";
import { logEvent } from "./Logger.js";

/**
 * @file Executes a plan's steps against an AgentRun, with retry and
 * validation baked into each step. Steps run sequentially — parallel
 * execution is out of scope for the MVP per the roadmap.
 */

/**
 * A single unit of work within a plan.
 * @typedef {Object} PlanStep
 * @property {number} stepNumber - The step's position in the plan.
 * @property {string} name - Human-readable step name.
 * @property {string} [capability] - Capability tag used to resolve an executor.
 */

/**
 * Performs the actual work for a step (e.g. invoking an agent).
 * @callback StepExecutor
 * @param {PlanStep} step - The step to execute.
 * @returns {Promise<*>} The step's output.
 */

/**
 * Resolves the executor to use for a given step.
 * @callback ExecutorResolver
 * @param {PlanStep} step - The step needing an executor.
 * @returns {StepExecutor} The executor function for this step.
 */

/**
 * Result of executing a single step.
 * @typedef {Object} StepResult
 * @property {boolean} success - Whether the step completed successfully.
 * @property {*} [output] - The step's output, when successful.
 * @property {Error|{code?: string, message: string}} [error] - The failure, when unsuccessful.
 */

/**
 * Result of executing a full plan.
 * @typedef {Object} PlanResult
 * @property {boolean} success - Whether every step completed successfully.
 * @property {*[]} [outputs] - Each step's output, in order, when successful.
 * @property {number} [failedAtStep] - The stepNumber that failed, when unsuccessful.
 * @property {Error|{code?: string, message: string}} [error] - The failure, when unsuccessful.
 */

/**
 * Runs plan steps with retry-on-failure and output validation.
 */
export class ExecutionEngine {
  /**
   * Executes a single step, retrying on transient/invalid-output failures
   * and recording the outcome on the AgentRun via addStep.
   * @param {string} runId - The AgentRun this step belongs to.
   * @param {PlanStep} step - The step to execute.
   * @param {StepExecutor} executor - Performs the step's actual work.
   * @param {import("../validation/Validator.js").ValidationSchema} [schema] - Optional output schema.
   * @returns {Promise<StepResult>} The step's outcome.
   */
  async executeStep(runId, step, executor, schema) {
    logEvent(runId, "step_started", {
      stepNumber: step.stepNumber,
      name: step.name
    });

    let attemptNumber = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let error;

      try {
        const output = await executor(step);

        const validation = validateOutput(output, schema);
        if (validation.valid) {
          await addStep(runId, {
            stepNumber: step.stepNumber,
            name: step.name,
            status: "completed",
            output,
            attempts: attemptNumber + 1
          });

          logEvent(runId, "step_completed", {
            stepNumber: step.stepNumber,
            attempts: attemptNumber + 1
          });

          return { success: true, output };
        }

        error = {
          code: "INVALID_OUTPUT",
          message: validation.error,
          retryable: true
        };
      } catch (caughtError) {
        error = caughtError;
      }

      if (shouldRetry(attemptNumber, error)) {
        await wait(500 * (attemptNumber + 1));
        attemptNumber += 1;
        continue;
      }

      await addStep(runId, {
        stepNumber: step.stepNumber,
        name: step.name,
        status: "failed",
        error: { code: error.code, message: error.message },
        attempts: attemptNumber + 1
      });

      logEvent(runId, "step_failed", {
        stepNumber: step.stepNumber,
        error: error.code || error.message
      });

      return { success: false, error };
    }
  }

  /**
   * Executes every step in a plan, in order, stopping at the first failure.
   * @param {string} runId - The AgentRun this plan belongs to.
   * @param {{ steps: PlanStep[] }} plan - The plan to execute.
   * @param {ExecutorResolver} executorResolver - Resolves an executor for each step.
   * @returns {Promise<PlanResult>} The plan's outcome.
   */
  async executePlan(runId, plan, executorResolver) {
    const outputs = [];

    for (const step of plan.steps) {
      const executor = executorResolver(step);
      const result = await this.executeStep(runId, step, executor);

      if (!result.success) {
        return {
          success: false,
          failedAtStep: step.stepNumber,
          error: result.error
        };
      }

      outputs.push(result.output);
    }

    return { success: true, outputs };
  }
}

/**
 * Shared execution engine instance for the AI module.
 * @type {ExecutionEngine}
 */
export default new ExecutionEngine();
