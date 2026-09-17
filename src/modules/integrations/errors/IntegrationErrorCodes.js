/**
 * @file Canonical integration error codes, per the roadmap.
 *
 * Tools and adapters should throw/return one of these codes (not an
 * ad-hoc string) so callers — ExecutionEngine's retry logic, UI error
 * handling, monitoring — can reason about failures consistently across
 * every provider.
 */

const IntegrationErrorCodes = Object.freeze({
  /** No IntegrationAccount exists for this organization/provider combination. */
  NOT_CONNECTED: "NOT_CONNECTED",

  /** The request could not be authenticated (e.g. an invalid webhook signature). */
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",

  /** The stored credential has expired and needs re-authentication. */
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  /** The connected account lacks the required capability/scope for this operation. */
  INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",

  /** The requested operation isn't supported by this provider/integration type. */
  CAPABILITY_NOT_SUPPORTED: "CAPABILITY_NOT_SUPPORTED",

  /** The referenced content item does not exist. */
  INVALID_CONTENT: "INVALID_CONTENT",

  /** The provider rejected the request due to rate limiting. */
  PROVIDER_RATE_LIMIT: "PROVIDER_RATE_LIMIT",

  /** The provider's API call failed unexpectedly. */
  PROVIDER_ERROR: "PROVIDER_ERROR",

  /** This operation was already executed (its idempotencyKey was already used). */
  DUPLICATE_OPERATION: "DUPLICATE_OPERATION",

  /** The content item is not in the lifecycle state this operation requires. */
  INVALID_LIFECYCLE_STATE: "INVALID_LIFECYCLE_STATE"
});

export default IntegrationErrorCodes;
