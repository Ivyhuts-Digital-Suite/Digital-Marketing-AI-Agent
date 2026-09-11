/**
 * @file Type definitions for AI agents.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A single unit of work handed to an agent.
 * @typedef {Object} AgentInput
 * @property {string} [prompt] - Free-form instruction or request for the agent.
 * @property {Object<string, *>} [params] - Structured parameters for the task.
 */

/**
 * Ambient context supplied to an agent on each run.
 * @typedef {Object} AgentContext
 * @property {string} organizationId - Organization the run is scoped to.
 * @property {string} [runId] - Identifier of the current agent run.
 * @property {Object<string, *>} [metadata] - Arbitrary contextual data.
 */

/**
 * The result produced by an agent run.
 * @typedef {Object} AgentResult
 * @property {boolean} success - Whether the run completed successfully.
 * @property {*} [output] - The produced output payload.
 * @property {string} [error] - Error message when `success` is false.
 */

/**
 * Executes the agent against a given input and context.
 * @callback AgentRun
 * @param {AgentInput} input - The task input for this run.
 * @param {AgentContext} context - Ambient context for this run.
 * @returns {Promise<AgentResult>} Resolves with the agent's result.
 */

/**
 * An AI agent capable of performing digital-marketing tasks.
 * @typedef {Object} Agent
 * @property {string} name - Unique, human-readable agent name.
 * @property {string} description - What the agent does and when to use it.
 * @property {string[]} capabilities - Capability tags, e.g. "strategy", "content".
 * @property {AgentRun} run - Runs the agent; returns a Promise.
 */

export {};
