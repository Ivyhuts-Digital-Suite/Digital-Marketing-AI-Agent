export class InvalidContentIntelligenceInputError extends Error {
  constructor(reason: string) {
    super(`Invalid content intelligence input: ${reason}`);
    this.name = "InvalidContentIntelligenceInputError";
  }
}

/** No CompanyIntelligence/BrandProfile/Product/Service exists yet for this organization. */
export class NoCompanyKnowledgeForContentError extends Error {
  constructor(organizationId: string) {
    super(
      `No company knowledge is available yet for organization "${organizationId}" - generate Company Intelligence first.`
    );
    this.name = "NoCompanyKnowledgeForContentError";
  }
}

/** Topic discovery ran but produced no usable (non-duplicate, valid) candidates. */
export class NoViableTopicsError extends Error {
  constructor(organizationId: string) {
    super(`No viable content topics could be produced for organization "${organizationId}".`);
    this.name = "NoViableTopicsError";
  }
}

/** Missing/invalid OPENAI_API_KEY, or another misconfiguration that prevents calling the LLM at all. */
export class ContentIntelligenceConfigurationError extends Error {
  constructor(reason: string) {
    super(`Content intelligence is not configured correctly: ${reason}`);
    this.name = "ContentIntelligenceConfigurationError";
  }
}

/** The OpenAI request itself failed (network, auth, rate limit, etc.). */
export class ContentIntelligenceLlmRequestError extends Error {
  constructor(reason: string) {
    super(`Content intelligence LLM request failed: ${reason}`);
    this.name = "ContentIntelligenceLlmRequestError";
  }
}

/** The LLM responded, but its content was not valid JSON or did not match the expected structure. */
export class InvalidContentIntelligenceLlmResponseError extends Error {
  constructor(reason: string) {
    super(`Content intelligence LLM response was invalid: ${reason}`);
    this.name = "InvalidContentIntelligenceLlmResponseError";
  }
}

/** Reading or writing ContentPlan/ContentItem failed. */
export class ContentIntelligenceDatabaseError extends Error {
  constructor(reason: string) {
    super(`Content intelligence database operation failed: ${reason}`);
    this.name = "ContentIntelligenceDatabaseError";
  }
}

export class ContentPlanNotFoundError extends Error {
  constructor(planId: string) {
    super(`Content plan "${planId}" was not found.`);
    this.name = "ContentPlanNotFoundError";
  }
}
