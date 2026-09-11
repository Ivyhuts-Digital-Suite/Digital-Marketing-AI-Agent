import AgentRun from "../../../models/agentRun.model.js";

/**
 * @file Persistence helpers for the AgentRun lifecycle.
 * Thin wrappers around the AgentRun model used by the agent runtime.
 */

/**
 * Creates a new queued AgentRun.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} [params.userId]
 * @param {string} [params.taskId]
 * @param {string} params.agentType
 * @param {string} [params.request]
 * @param {*} [params.context]
 * @returns {Promise<import("mongoose").Document>} The saved AgentRun document.
 */
export async function createRun({
  organizationId,
  userId,
  taskId,
  agentType,
  request,
  context
}) {
  try {
    const run = new AgentRun({
      organizationId,
      userId,
      taskId,
      agentType,
      request,
      context,
      status: "queued",
      startedAt: new Date()
    });

    return await run.save();
  } catch (error) {
    console.error("createRun failed:", error);
    throw error;
  }
}

/**
 * Updates the status of a run.
 * @param {string} runId
 * @param {string} status
 * @returns {Promise<import("mongoose").Document|null>} The updated document.
 */
export async function updateRunStatus(runId, status) {
  try {
    return await AgentRun.findByIdAndUpdate(
      runId,
      { status },
      { new: true }
    );
  } catch (error) {
    console.error("updateRunStatus failed:", error);
    throw error;
  }
}

/**
 * Appends a step to a run's steps array.
 * @param {string} runId
 * @param {Object} step
 * @returns {Promise<import("mongoose").Document|null>} The updated document.
 */
export async function addStep(runId, step) {
  try {
    return await AgentRun.findByIdAndUpdate(
      runId,
      { $push: { steps: step } },
      { new: true }
    );
  } catch (error) {
    console.error("addStep failed:", error);
    throw error;
  }
}

/**
 * Appends a tool call to a run's toolCalls array.
 * @param {string} runId
 * @param {Object} toolCall
 * @returns {Promise<import("mongoose").Document|null>} The updated document.
 */
export async function addToolCall(runId, toolCall) {
  try {
    return await AgentRun.findByIdAndUpdate(
      runId,
      { $push: { toolCalls: toolCall } },
      { new: true }
    );
  } catch (error) {
    console.error("addToolCall failed:", error);
    throw error;
  }
}

/**
 * Marks a run completed, recording output, usage, cost and duration.
 * @param {string} runId
 * @param {Object} result
 * @param {*} [result.output]
 * @param {Object} [result.usage]
 * @param {Object} [result.cost]
 * @returns {Promise<import("mongoose").Document|null>} The updated document.
 */
export async function completeRun(runId, { output, usage, cost }) {
  try {
    const run = await AgentRun.findById(runId);
    if (!run) {
      return null;
    }

    const completedAt = new Date();
    const durationMs = run.startedAt
      ? completedAt.getTime() - run.startedAt.getTime()
      : undefined;

    run.status = "completed";
    run.output = output;
    run.usage = usage;
    run.cost = cost;
    run.completedAt = completedAt;
    run.durationMs = durationMs;

    return await run.save();
  } catch (error) {
    console.error("completeRun failed:", error);
    throw error;
  }
}

/**
 * Marks a run failed, recording the error details.
 * @param {string} runId
 * @param {Object} error
 * @param {string} [error.code]
 * @param {string} [error.message]
 * @param {string} [error.stack]
 * @returns {Promise<import("mongoose").Document|null>} The updated document.
 */
export async function failRun(runId, { code, message, stack }) {
  try {
    return await AgentRun.findByIdAndUpdate(
      runId,
      {
        status: "failed",
        error: { code, message, stack },
        completedAt: new Date()
      },
      { new: true }
    );
  } catch (error) {
    console.error("failRun failed:", error);
    throw error;
  }
}
