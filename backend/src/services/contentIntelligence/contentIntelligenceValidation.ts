import { FunnelStage } from "./content.types";
import { InvalidContentIntelligenceLlmResponseError } from "./errors";
import { TopicCandidate } from "./types";

const FUNNEL_STAGES: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

/**
 * Strict-ish validation of the content intelligence LLM's JSON responses
 * (never blindly trust arbitrary LLM output). This only checks STRUCTURE -
 * it cannot verify the model actually followed the "don't invent facts"
 * instruction, which relies on the prompt and on the context we chose to
 * send it (see contentIntelligenceLlm.ts).
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidContentIntelligenceLlmResponseError(`field "${field}" must be a non-empty string`);
  }
  return value;
}

function requireStringArray(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new InvalidContentIntelligenceLlmResponseError(`field "${field}" must be an array`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

function requireScore(obj: Record<string, unknown>, field: string): number {
  const value = obj[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidContentIntelligenceLlmResponseError(`field "${field}" must be a number`);
  }
  return Math.max(0, Math.min(100, value));
}

function requireFunnelStage(obj: Record<string, unknown>, field: string): FunnelStage {
  const value = obj[field];
  if (typeof value !== "string" || !FUNNEL_STAGES.includes(value as FunnelStage)) {
    throw new InvalidContentIntelligenceLlmResponseError(`field "${field}" must be one of ${FUNNEL_STAGES.join(", ")}`);
  }
  return value as FunnelStage;
}

export interface RawTopicCandidateWithScores extends TopicCandidate {
  relevance: number;
  strategicAlignment: number;
  audienceValue: number;
  novelty: number;
}

function validateTopicCandidate(raw: unknown, index: number): RawTopicCandidateWithScores {
  if (!isPlainObject(raw)) {
    throw new InvalidContentIntelligenceLlmResponseError(`topics[${index}] must be an object`);
  }
  return {
    topic: requireString(raw, "topic"),
    angle: requireString(raw, "angle"),
    rationale: requireString(raw, "rationale"),
    suggestedFunnelStage: requireFunnelStage(raw, "suggestedFunnelStage"),
    suggestedContentPillar: requireString(raw, "suggestedContentPillar"),
    relevance: requireScore(raw, "relevance"),
    strategicAlignment: requireScore(raw, "strategicAlignment"),
    audienceValue: requireScore(raw, "audienceValue"),
    novelty: requireScore(raw, "novelty"),
  };
}

/** Parses and validates the topic-discovery LLM response. Throws InvalidContentIntelligenceLlmResponseError on any problem. */
export function parseAndValidateTopicCandidates(rawText: string): RawTopicCandidateWithScores[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidContentIntelligenceLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed) || !Array.isArray(parsed.topics)) {
    throw new InvalidContentIntelligenceLlmResponseError('response must be a JSON object with a "topics" array');
  }

  return parsed.topics.map((item, index) => validateTopicCandidate(item, index));
}

export interface RawBriefResponse {
  hook: string;
  coreMessage: string;
  keyPoints: string[];
  cta: string;
  successMetric: string;
  rationale: string;
}

/** Parses and validates the content-brief LLM response. Throws InvalidContentIntelligenceLlmResponseError on any problem. */
export function parseAndValidateBriefResponse(rawText: string): RawBriefResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new InvalidContentIntelligenceLlmResponseError("response was not valid JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new InvalidContentIntelligenceLlmResponseError("response must be a JSON object");
  }

  return {
    hook: requireString(parsed, "hook"),
    coreMessage: requireString(parsed, "coreMessage"),
    keyPoints: requireStringArray(parsed, "keyPoints"),
    cta: requireString(parsed, "cta"),
    successMetric: requireString(parsed, "successMetric"),
    rationale: requireString(parsed, "rationale"),
  };
}
