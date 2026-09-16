import { InvalidContentStudioLlmResponseError } from "./errors";

/**
 * Strict-ish validation of the creative-direction LLM's JSON response
 * (never blindly trust arbitrary LLM output). Mirrors
 * contentIntelligence/contentIntelligenceValidation.ts's approach - this
 * only checks STRUCTURE, not whether the model actually stayed grounded.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidContentStudioLlmResponseError(`field "${field}" must be a non-empty string`);
  }
  return value;
}

function optionalStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new InvalidContentStudioLlmResponseError(`field "${field}" must be an array`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

export interface RawCreativeDirectionResponse {
  toneOfVoice: string;
  visualDirection: {
    style: string;
    mood: string;
    composition: string;
    visualElements: string[];
    colorGuidance: string;
    typographyGuidance: string;
  };
  generationRequirements: string[];
}

/** Parses and validates the creative-direction LLM response. Throws InvalidContentStudioLlmResponseError on any problem. */
export function parseAndValidateCreativeDirectionResponse(rawText: string): RawCreativeDirectionResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidContentStudioLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new InvalidContentStudioLlmResponseError("response must be a JSON object");
  }

  const visualDirectionRaw = parsed.visualDirection;
  if (!isPlainObject(visualDirectionRaw)) {
    throw new InvalidContentStudioLlmResponseError('field "visualDirection" must be an object');
  }

  return {
    toneOfVoice: requireString(parsed, "toneOfVoice"),
    visualDirection: {
      style: requireString(visualDirectionRaw, "style"),
      mood: requireString(visualDirectionRaw, "mood"),
      composition: requireString(visualDirectionRaw, "composition"),
      visualElements: optionalStringArray(visualDirectionRaw, "visualElements"),
      colorGuidance: requireString(visualDirectionRaw, "colorGuidance"),
      typographyGuidance: requireString(visualDirectionRaw, "typographyGuidance"),
    },
    generationRequirements: optionalStringArray(parsed, "generationRequirements"),
  };
}
