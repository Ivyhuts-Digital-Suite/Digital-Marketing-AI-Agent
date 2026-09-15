export class InvalidAnalyticsInputError extends Error {
  constructor(reason: string) {
    super(`Invalid analytics input: ${reason}`);
    this.name = "InvalidAnalyticsInputError";
  }
}

export class AnalyticsDatabaseError extends Error {
  constructor(reason: string) {
    super(`Analytics database operation failed: ${reason}`);
    this.name = "AnalyticsDatabaseError";
  }
}

/** Missing/invalid OPENAI_API_KEY, or another misconfiguration that prevents calling the LLM at all. */
export class AnalyticsAgentConfigurationError extends Error {
  constructor(reason: string) {
    super(`Analytics agent is not configured correctly: ${reason}`);
    this.name = "AnalyticsAgentConfigurationError";
  }
}

export class AnalyticsAgentLlmRequestError extends Error {
  constructor(reason: string) {
    super(`Analytics agent LLM request failed: ${reason}`);
    this.name = "AnalyticsAgentLlmRequestError";
  }
}

export class InvalidAnalyticsAgentLlmResponseError extends Error {
  constructor(reason: string) {
    super(`Analytics agent LLM response was invalid: ${reason}`);
    this.name = "InvalidAnalyticsAgentLlmResponseError";
  }
}

export class OptimizationAgentConfigurationError extends Error {
  constructor(reason: string) {
    super(`Optimization agent is not configured correctly: ${reason}`);
    this.name = "OptimizationAgentConfigurationError";
  }
}

export class OptimizationAgentLlmRequestError extends Error {
  constructor(reason: string) {
    super(`Optimization agent LLM request failed: ${reason}`);
    this.name = "OptimizationAgentLlmRequestError";
  }
}

export class InvalidOptimizationAgentLlmResponseError extends Error {
  constructor(reason: string) {
    super(`Optimization agent LLM response was invalid: ${reason}`);
    this.name = "InvalidOptimizationAgentLlmResponseError";
  }
}

export class RecommendationNotFoundError extends Error {
  constructor(id: string) {
    super(`Optimization recommendation "${id}" was not found.`);
    this.name = "RecommendationNotFoundError";
  }
}

export class InvalidRecommendationStateError extends Error {
  constructor(reason: string) {
    super(`Invalid optimization recommendation state transition: ${reason}`);
    this.name = "InvalidRecommendationStateError";
  }
}

export class FindingNotFoundError extends Error {
  constructor(id: string) {
    super(`Analytics finding "${id}" was not found.`);
    this.name = "FindingNotFoundError";
  }
}
