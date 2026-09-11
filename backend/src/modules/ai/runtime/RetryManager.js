/**
 * @file Retry policy for agent runs.
 *
 * Policy: an attempt is retried only if both hold:
 *   1. We have not exhausted the retry budget — at most 2 retries, i.e.
 *      at most 3 total attempts (attempt numbers 0, 1, 2).
 *   2. The error is retryable — either explicitly flagged via
 *      `error.retryable === true`, or its `error.code` is one of the
 *      known-transient codes ("TIMEOUT", "MODEL_ERROR", "INVALID_OUTPUT").
 *
 * Errors like "PERMISSION_DENIED", "INVALID_ORGANIZATION", or
 * "MISSING_DATA" reflect a real problem with the request or its context,
 * not a transient failure, so they are never retried regardless of
 * attempt number.
 */

/** Error codes considered transient and safe to retry. */
const RETRYABLE_ERROR_CODES = new Set([
  "TIMEOUT",
  "MODEL_ERROR",
  "INVALID_OUTPUT"
]);

/** Maximum number of retries allowed (max 3 total attempts). */
const MAX_RETRIES = 2;

/**
 * Decides whether a failed attempt should be retried.
 * @param {number} attemptNumber - Zero-based index of the attempt that just failed.
 * @param {Error & { retryable?: boolean, code?: string }} error - The error that occurred.
 * @returns {boolean} True if another attempt should be made.
 */
export function shouldRetry(attemptNumber, error) {
  if (attemptNumber >= MAX_RETRIES) {
    return false;
  }

  if (error && error.retryable === true) {
    return true;
  }

  return Boolean(error && RETRYABLE_ERROR_CODES.has(error.code));
}

/**
 * Resolves after the given delay. Useful for spacing out retries.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>} Resolves once the delay has elapsed.
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
