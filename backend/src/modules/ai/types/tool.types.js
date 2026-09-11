/**
 * @file Type definitions for agent tools.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A single unit of work handed to a tool.
 * @typedef {Object} ToolInput
 * @property {Object<string, *>} [params] - Structured parameters for the tool call.
 */

/**
 * Ambient context supplied to a tool on each execution.
 * @typedef {Object} ToolContext
 * @property {string} organizationId - Organization the call is scoped to.
 * @property {string} [runId] - Identifier of the current agent run.
 * @property {Object<string, *>} [metadata] - Arbitrary contextual data.
 */

/**
 * The result produced by a tool execution.
 * @typedef {Object} ToolResult
 * @property {boolean} success - Whether the execution completed successfully.
 * @property {*} [data] - The produced output payload.
 * @property {string} [error] - Error message when `success` is false.
 */

/**
 * Executes the tool against a given input and context.
 * @callback ToolExecute
 * @param {ToolInput} input - The input for this call.
 * @param {ToolContext} context - Ambient context for this call.
 * @returns {Promise<ToolResult>} Resolves with the tool's result.
 */

/**
 * A capability an agent can invoke to act on the outside world.
 * @typedef {Object} Tool
 * @property {string} name - Unique, human-readable tool name.
 * @property {string} description - What the tool does and when to use it.
 * @property {ToolExecute} execute - Executes the tool; returns a Promise.
 */

export {};
