/**
 * @file Type definitions for rule-based brand/content validation.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * The outcome of a single validation rule.
 * @typedef {Object} ValidationCheck
 * @property {string} name - The check's identifier, e.g. "has_cta".
 * @property {boolean} passed - Whether the content passed this check.
 * @property {string} message - Human-readable status for this check.
 */

/**
 * The overall result of validating a piece of content against a brief.
 * @typedef {Object} BrandValidationResult
 * @property {boolean} approved - True only if every check passed.
 * @property {ValidationCheck[]} checks - The individual checks that were run.
 * @property {string[]} revisionInstructions - Human-readable fixes for each failed check.
 */

export {};
