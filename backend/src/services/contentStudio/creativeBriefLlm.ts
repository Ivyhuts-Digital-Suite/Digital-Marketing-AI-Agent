import { z } from "zod";
import { IContentItem } from "../../models/ContentItem";
import { CompanyBrainContext } from "../contentIntelligence/types";
import { aiService } from "../ai/aiService";
import { LLMProviderError } from "../ai/llmErrors";
import { ContentStudioConfigurationError, ContentStudioLlmRequestError } from "./errors";
import { parseAndValidateCreativeDirectionResponse, RawCreativeDirectionResponse } from "./creativeBriefValidation";

function getModelOverride(): string | undefined {
  const model = process.env.CONTENT_STUDIO_MODEL;
  return model && model.trim().length > 0 ? model.trim() : undefined;
}

function formatCompanyBrain(brain: CompanyBrainContext | null): string {
  if (!brain) return "(no company knowledge is available yet)";
  const lines = [
    brain.brandVoice ? `Brand voice: ${brain.brandVoice}` : null,
    brain.differentiators.length ? `Differentiators: ${brain.differentiators.join("; ")}` : null,
    brain.valuePropositions.length ? `Value propositions: ${brain.valuePropositions.join("; ")}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "(no company knowledge is available yet)";
}

const CREATIVE_DIRECTION_SCHEMA = z.object({
  toneOfVoice: z.string(),
  visualDirection: z.object({
    style: z.string(),
    mood: z.string(),
    composition: z.string(),
    visualElements: z.array(z.string()),
    colorGuidance: z.string(),
    typographyGuidance: z.string(),
  }),
  generationRequirements: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are a creative director bridging an approved marketing content plan into visual production direction for a marketing platform.

You are given a piece of content whose topic, hook, core message, key points, and CTA have ALREADY been decided and approved - you do NOT invent, change, rephrase, or add to any of that marketing content. Your ONLY job is to describe how it should look: tone of voice for the visuals, and a visual direction (style, mood, composition, visual elements, color guidance, typography guidance), plus any generation requirements a designer/video editor would need to know (e.g. "must show the product screenshot", "avoid stock photos of people").

You never invent brand colors, claims, or facts not present in the CONTEXT. If brand voice/guidance isn't provided, give sensible, professional B2B defaults.`;

/** Pure/testable prompt builder - no network call. */
export function buildCreativeDirectionPrompt(item: IContentItem, brain: CompanyBrainContext | null): string {
  return [
    `FORMAT: ${item.format}`,
    `TOPIC: ${item.topic}`,
    `ANGLE: ${item.angle}`,
    `HOOK: ${item.hook}`,
    `CORE MESSAGE: ${item.message}`,
    item.keyPoints.length > 0 ? `KEY POINTS: ${item.keyPoints.join("; ")}` : null,
    `CTA: ${item.cta}`,
    `CONTENT PILLAR: ${item.contentPillar}`,
    `COMPANY BRAIN:\n${formatCompanyBrain(brain)}`,
    "Produce tone-of-voice and visual direction for this specific piece of content.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

/** Never fabricates a result: if GEMINI_API_KEY is missing, this throws before making any network call. */
export async function requestCreativeDirection(
  item: IContentItem,
  brain: CompanyBrainContext | null
): Promise<RawCreativeDirectionResponse> {
  const userPrompt = buildCreativeDirectionPrompt(item, brain);

  let result;
  try {
    result = await aiService.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      model: getModelOverride(),
      temperature: 0.6,
      maxTokens: 2048,
      schema: CREATIVE_DIRECTION_SCHEMA,
    });
  } catch (error) {
    if (error instanceof LLMProviderError && error.kind === "configuration") {
      throw new ContentStudioConfigurationError(error.message);
    }
    throw new ContentStudioLlmRequestError(error instanceof Error ? error.message : String(error));
  }

  return parseAndValidateCreativeDirectionResponse(JSON.stringify(result.data));
}
