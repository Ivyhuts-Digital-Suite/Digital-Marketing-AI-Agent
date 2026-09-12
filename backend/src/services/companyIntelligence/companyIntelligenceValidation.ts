import { InvalidLlmResponseError } from "./errors";
import { CompanyIntelligenceLlmResult, LlmProductOrService } from "./types";

/**
 * Strict-ish validation of the LLM's JSON response (Step 7 requirement:
 * "never blindly trust arbitrary LLM output"). Required top-level fields
 * must exist with the right type or we reject the whole response.
 * Optional sub-fields on products/services are defaulted to empty rather
 * than rejected, so a minor omission doesn't throw away an otherwise
 * usable response.
 *
 * This only checks STRUCTURE. It cannot verify that the LLM followed the
 * "don't invent facts" instruction - that relies on the prompt and on the
 * context we chose to send it (see companyIntelligenceContext.ts).
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string") {
    throw new InvalidLlmResponseError(`field "${field}" must be a string`);
  }
  return value;
}

function requireStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new InvalidLlmResponseError(`field "${field}" must be an array`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

function optionalStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function optionalString(obj: Record<string, unknown>, field: string): string | undefined {
  const value = obj[field];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function validateProductOrService(raw: unknown, field: string, index: number): LlmProductOrService {
  if (!isPlainObject(raw)) {
    throw new InvalidLlmResponseError(`"${field}[${index}]" must be an object`);
  }

  return {
    name: requireString(raw, "name"),
    description: requireString(raw, "description"),
    targetAudience: optionalString(raw, "targetAudience"),
    problemsSolved: optionalStringArray(raw, "problemsSolved"),
    benefits: optionalStringArray(raw, "benefits"),
    differentiators: optionalStringArray(raw, "differentiators"),
  };
}

function validateProductOrServiceArray(
  obj: Record<string, unknown>,
  field: string
): LlmProductOrService[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new InvalidLlmResponseError(`field "${field}" must be an array`);
  }
  return value.map((item, index) => validateProductOrService(item, field, index));
}

/** Parses the LLM's raw text response as JSON, then validates its structure. Throws InvalidLlmResponseError on any problem. */
export function parseAndValidateLlmResponse(rawText: string): CompanyIntelligenceLlmResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new InvalidLlmResponseError("response must be a JSON object");
  }

  return {
    companyOverview: requireString(parsed, "companyOverview"),
    industry: requireString(parsed, "industry"),
    targetCustomers: requireStringArray(parsed, "targetCustomers"),
    customerProblems: requireStringArray(parsed, "customerProblems"),
    products: validateProductOrServiceArray(parsed, "products"),
    services: validateProductOrServiceArray(parsed, "services"),
    differentiators: requireStringArray(parsed, "differentiators"),
    competitors: requireStringArray(parsed, "competitors"),
    valuePropositions: requireStringArray(parsed, "valuePropositions"),
    brandVoice: requireString(parsed, "brandVoice"),
    marketingMessaging: requireStringArray(parsed, "marketingMessaging"),
    allowedClaims: requireStringArray(parsed, "allowedClaims"),
    forbiddenClaims: requireStringArray(parsed, "forbiddenClaims"),
    importantFacts: requireStringArray(parsed, "importantFacts"),
  };
}
