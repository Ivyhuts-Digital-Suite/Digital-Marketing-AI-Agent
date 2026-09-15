import { OptimizationRiskLevel } from "../../../models/OptimizationRecommendation";
import { InvalidOptimizationAgentLlmResponseError } from "../errors";

const RISK_LEVELS: OptimizationRiskLevel[] = ["low", "medium", "high"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidOptimizationAgentLlmResponseError(`field "${field}" must be a non-empty string`);
  }
  return value;
}

function requireStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new InvalidOptimizationAgentLlmResponseError(`field "${field}" must be an array`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

function requireConfidence(obj: Record<string, unknown>, field: string): number {
  const value = obj[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidOptimizationAgentLlmResponseError(`field "${field}" must be a number`);
  }
  return Math.max(0, Math.min(1, value));
}

function requireRiskLevel(obj: Record<string, unknown>, field: string): OptimizationRiskLevel {
  const value = obj[field];
  if (typeof value !== "string" || !RISK_LEVELS.includes(value as OptimizationRiskLevel)) {
    throw new InvalidOptimizationAgentLlmResponseError(`field "${field}" must be one of ${RISK_LEVELS.join(", ")}`);
  }
  return value as OptimizationRiskLevel;
}

export interface RawOptimizationHypothesis {
  hypothesis: string;
  evidenceRefs: number[];
}

function validateHypothesis(raw: unknown, index: number): RawOptimizationHypothesis {
  if (!isPlainObject(raw)) {
    throw new InvalidOptimizationAgentLlmResponseError(`hypotheses[${index}] must be an object`);
  }
  const hypothesis = requireString(raw, "hypothesis");
  const rawRefs = raw.evidenceRefs;
  if (!Array.isArray(rawRefs)) {
    throw new InvalidOptimizationAgentLlmResponseError(`hypotheses[${index}].evidenceRefs must be an array`);
  }
  const evidenceRefs = rawRefs.filter((ref): ref is number => typeof ref === "number" && Number.isInteger(ref));
  return { hypothesis, evidenceRefs };
}

export interface RawOptimizationResponse {
  diagnosis: string;
  hypotheses: RawOptimizationHypothesis[];
  recommendedAction: string;
  expectedImpact: string;
  confidence: number;
  riskLevel: OptimizationRiskLevel;
  requiredTools: string[];
}

export function parseAndValidateOptimizationResponse(rawText: string): RawOptimizationResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidOptimizationAgentLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed) || !Array.isArray(parsed.hypotheses)) {
    throw new InvalidOptimizationAgentLlmResponseError('response must be a JSON object with a "hypotheses" array');
  }

  return {
    diagnosis: requireString(parsed, "diagnosis"),
    hypotheses: parsed.hypotheses.map((item, index) => validateHypothesis(item, index)),
    recommendedAction: requireString(parsed, "recommendedAction"),
    expectedImpact: requireString(parsed, "expectedImpact"),
    confidence: requireConfidence(parsed, "confidence"),
    riskLevel: requireRiskLevel(parsed, "riskLevel"),
    requiredTools: requireStringArray(parsed, "requiredTools"),
  };
}
