import { InvalidAnalyticsAgentLlmResponseError } from "../errors";

/**
 * Strict-ish validation of the Analytics Agent's JSON response, mirroring
 * the pattern already used by companyIntelligenceValidation.ts and
 * contentIntelligenceValidation.ts in this codebase.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidAnalyticsAgentLlmResponseError(`field "${field}" must be a non-empty string`);
  }
  return value;
}

function requireStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value) || value.length === 0) {
    throw new InvalidAnalyticsAgentLlmResponseError(`field "${field}" must be a non-empty array`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

export interface AnalyticsInterpretation {
  interpretation: string;
  possibleCauses: string[];
  businessImpact: string;
}

export function parseAndValidateAnalyticsInterpretation(rawText: string): AnalyticsInterpretation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidAnalyticsAgentLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new InvalidAnalyticsAgentLlmResponseError("response must be a JSON object");
  }

  return {
    interpretation: requireString(parsed, "interpretation"),
    possibleCauses: requireStringArray(parsed, "possibleCauses"),
    businessImpact: requireString(parsed, "businessImpact"),
  };
}
