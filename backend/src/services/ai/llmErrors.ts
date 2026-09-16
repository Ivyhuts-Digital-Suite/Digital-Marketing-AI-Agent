/**
 * Provider-independent error taxonomy for the LLM abstraction. Domain
 * modules (companyIntelligenceLlm.ts, etc.) catch this single type and map
 * `kind` onto their own existing domain error classes - so switching the
 * underlying provider never changes what a controller sees.
 */
export type LLMErrorKind =
  | "configuration"
  | "authentication"
  | "rate_limit"
  | "network"
  | "timeout"
  | "invalid_response"
  | "unknown";

export class LLMProviderError extends Error {
  readonly kind: LLMErrorKind;

  constructor(kind: LLMErrorKind, message: string) {
    super(message);
    this.name = "LLMProviderError";
    this.kind = kind;
  }
}
