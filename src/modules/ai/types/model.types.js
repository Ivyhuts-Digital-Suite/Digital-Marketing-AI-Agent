/**
 * @file Type definitions for AI provider models.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A generation request handed to an AI model.
 * @typedef {Object} AIModelInput
 * @property {string} prompt - The prompt to generate from.
 * @property {Object<string, *>} [params] - Provider-specific generation options.
 */

/**
 * Token accounting for a single generation.
 * @typedef {Object} AIModelUsage
 * @property {number} inputTokens - Tokens consumed by the input.
 * @property {number} outputTokens - Tokens produced in the output.
 * @property {number} totalTokens - Sum of input and output tokens.
 */

/**
 * The result produced by an AI model generation.
 * @typedef {Object} AIModelResult
 * @property {string} text - The generated text.
 * @property {AIModelUsage} usage - Token usage for this generation.
 */

/**
 * Generates a completion for the given input.
 * @callback AIModelGenerate
 * @param {AIModelInput} input - The generation request.
 * @returns {Promise<AIModelResult>} Resolves with the generated text and usage.
 */

/**
 * An AI provider interface used to generate text.
 * @typedef {Object} AIModel
 * @property {string} name - Unique, human-readable model name.
 * @property {AIModelGenerate} generate - Generates text; returns a Promise.
 */

export {};
