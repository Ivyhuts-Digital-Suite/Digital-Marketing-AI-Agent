/**
 * @file Basic MVP output validator.
 *
 * This only checks *shape*: that an output exists and, when a schema is
 * given, that it's an object carrying the required fields. It does not
 * (yet) validate business rules or output quality — e.g. whether a
 * strategy is any good, whether content matches brand voice, etc. Those
 * checks belong to a later, dedicated validation layer per the roadmap.
 */

/**
 * Minimal shape hint for validateOutput's `schema` argument.
 * @typedef {Object} ValidationSchema
 * @property {string[]} requiredFields - Keys that must be present on the output.
 */

/**
 * Result of a validation check.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the output passed validation.
 * @property {string} [error] - Descriptive failure reason when `valid` is false.
 */

/**
 * Validates an agent's output against an optional schema.
 *
 * With no schema, only checks that output is not null/undefined. With a
 * schema, additionally checks output is an object and has every key
 * listed in `schema.requiredFields`.
 *
 * @param {*} output - The output produced by an agent run.
 * @param {ValidationSchema} [schema] - Optional required-fields schema.
 * @returns {ValidationResult} Whether the output is valid, with an error message if not.
 */
export function validateOutput(output, schema) {
  try {
    if (!schema) {
      if (output === null || output === undefined) {
        return { valid: false, error: "Output is empty" };
      }

      return { valid: true };
    }

    if (output === null || typeof output !== "object") {
      return { valid: false, error: "Output must be an object" };
    }

    const requiredFields = schema.requiredFields || [];
    for (const field of requiredFields) {
      if (!(field in output)) {
        return { valid: false, error: `Missing required field: "${field}"` };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
