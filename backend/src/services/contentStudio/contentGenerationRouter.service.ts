import ContentPlan from "../../models/ContentPlan";
import { ensureCreativeBrief } from "./creativeBriefService";
import { resolvePlanAndItem } from "./contentResolver.service";
import {
  FormatEngineMismatchError,
  PlanNotReadyForGenerationError,
  UnsupportedFormatForGenerationError,
} from "./errors";
import { GenerationEngine, ResolvedGenerationContext } from "./contentStudio.types";

const FORMAT_TO_ENGINE: Partial<Record<string, GenerationEngine>> = {
  instagram_post: "graphic",
  instagram_carousel: "graphic",
  instagram_story: "graphic",
  instagram_reel: "video",
};

function resolveEngineForFormat(format: string): GenerationEngine {
  const engine = FORMAT_TO_ENGINE[format];
  if (!engine) {
    throw new UnsupportedFormatForGenerationError(format);
  }
  return engine;
}

/**
 * The single entry point every generation request goes through (Phase 6 of
 * the roadmap). Validates, in order:
 *
 *   1. Plan + item exist, belong to each other, and the caller belongs to
 *      the plan's organization (resolvePlanAndItem).
 *   2. The plan is "finalized" or "in_progress" - never "draft". The first
 *      successful call here also flips finalized -> in_progress, so the
 *      calendar can never be edited-then-regenerated silently once
 *      generation has begun.
 *   3. The content item's format resolves to the engine the caller
 *      actually invoked (a "reel" can't be generated via /graphics/generate
 *      and vice versa).
 *   4. A Creative Brief exists for the item, generating one on the fly via
 *      the same LLM-backed pipeline as POST /briefs if it doesn't.
 *
 * Authentication itself (step 1 of the roadmap's list) is enforced by the
 * `authenticate` middleware on every content-studio route before this ever
 * runs.
 */
export async function prepareGeneration(
  userId: string,
  contentPlanId: unknown,
  contentItemId: unknown,
  expectedEngine: GenerationEngine
): Promise<ResolvedGenerationContext> {
  const { plan, item } = await resolvePlanAndItem(userId, contentPlanId, contentItemId);

  if (plan.status !== "finalized" && plan.status !== "in_progress") {
    throw new PlanNotReadyForGenerationError(plan._id.toString(), plan.status);
  }

  const actualEngine = resolveEngineForFormat(item.format);
  if (actualEngine !== expectedEngine) {
    throw new FormatEngineMismatchError(item.format, expectedEngine, actualEngine);
  }

  if (plan.status === "finalized") {
    await ContentPlan.updateOne({ _id: plan._id, status: "finalized" }, { $set: { status: "in_progress" } });
    plan.status = "in_progress";
  }

  const brief = await ensureCreativeBrief(plan, item);

  return { plan, item, brief };
}
