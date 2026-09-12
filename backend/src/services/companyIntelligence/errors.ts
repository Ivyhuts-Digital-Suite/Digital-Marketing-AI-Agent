export class InvalidOrganizationIdError extends Error {
  constructor(reason: string) {
    super(`Invalid organizationId: ${reason}`);
    this.name = "InvalidOrganizationIdError";
  }
}

/** No usable KnowledgeSource/KnowledgeChunk/onboarding content exists yet for this organization. */
export class NoCompanyKnowledgeError extends Error {
  constructor(organizationId: string) {
    super(`No company knowledge is available yet for organization "${organizationId}".`);
    this.name = "NoCompanyKnowledgeError";
  }
}

/** Missing/invalid OPENAI_API_KEY, or another misconfiguration that prevents calling the LLM at all. */
export class CompanyIntelligenceConfigurationError extends Error {
  constructor(reason: string) {
    super(`Company intelligence generation is not configured correctly: ${reason}`);
    this.name = "CompanyIntelligenceConfigurationError";
  }
}

/** The OpenAI request itself failed (network, auth, rate limit, etc.). */
export class LlmRequestError extends Error {
  constructor(reason: string) {
    super(`Company intelligence LLM request failed: ${reason}`);
    this.name = "LlmRequestError";
  }
}

/** The LLM responded, but its content was not valid JSON or did not match the expected structure. */
export class InvalidLlmResponseError extends Error {
  constructor(reason: string) {
    super(`Company intelligence LLM response was invalid: ${reason}`);
    this.name = "InvalidLlmResponseError";
  }
}

/** Reading or writing CompanyIntelligence/BrandProfile/Product/Service failed. */
export class CompanyIntelligenceDatabaseError extends Error {
  constructor(reason: string) {
    super(`Company intelligence database operation failed: ${reason}`);
    this.name = "CompanyIntelligenceDatabaseError";
  }
}
