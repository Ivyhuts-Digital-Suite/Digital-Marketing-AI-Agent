import { Types } from "mongoose";
import CreativeAsset, { ICreativeAsset } from "../../models/CreativeAsset";
import { ICreativeBrief } from "../../models/CreativeBrief";
import { IContentItem } from "../../models/ContentItem";
import { IContentPlan } from "../../models/ContentPlan";
import { validateGraphicAsset } from "./brandValidationService";
import { prepareGeneration } from "./contentGenerationRouter.service";
import { DesignSpecification, GraphicRenderMode, GraphicStyle, InfographicSpec, VisualConcept } from "./contentStudio.types";
import { ContentStudioConfigurationError, GenerationProviderError } from "./errors";
import { completeJob, createJob, failJob, markJobProcessing } from "./generationJobService";
import { getImageProvider } from "./providers/imageProviderFactory";
import { ImageGenerationRequest } from "./providers/imageProvider.interface";

/** Graphic Engine pipeline Step 1: turns a brief's visual direction into a plain-language visual concept. Pure/deterministic - no LLM call, no invented content. */
function buildVisualConcept(brief: ICreativeBrief): VisualConcept {
  return {
    subject: brief.topic,
    style: brief.visualDirection.style || "clean, professional B2B",
    mood: brief.visualDirection.mood || "confident",
    composition: brief.visualDirection.composition || "centered focal subject with clear text hierarchy",
    visualElements: brief.visualDirection.visualElements,
    colorGuidance: brief.visualDirection.colorGuidance || "brand primary/secondary colors",
    typographyGuidance: brief.visualDirection.typographyGuidance || "bold sans-serif headline",
  };
}

const NUMERIC_HINT = /\d/;

/** Splits the brief's already-approved keyPoints into "looks like a statistic" vs plain points - purely a rendering-layout heuristic, never invents new numbers/claims. */
function buildInfographicSpec(brief: ICreativeBrief): InfographicSpec {
  const keyStatistics = brief.keyPoints.filter((point) => NUMERIC_HINT.test(point));
  const keyPoints = brief.keyPoints.filter((point) => !NUMERIC_HINT.test(point));

  return {
    title: brief.topic,
    keyStatistics,
    keyPoints: keyPoints.length > 0 ? keyPoints : brief.keyPoints,
    iconHints: brief.visualDirection.visualElements,
    cta: brief.cta,
  };
}

/** Graphic Engine pipeline Step 2: turns a visual concept into concrete, per-slide render specs. graphicStyle is chosen by the caller (frontend), never invented here - see GraphicStyle in contentStudio.types.ts. */
function buildDesignSpecs(brief: ICreativeBrief, visualConcept: VisualConcept, graphicStyle: GraphicStyle): DesignSpecification[] {
  const renderMode: GraphicRenderMode = "ai_image_generation";
  const aspectRatio = brief.visualDirection.aspectRatio;

  if (graphicStyle === "infographic" && brief.format !== "instagram_carousel") {
    return [
      {
        renderMode,
        aspectRatio,
        subtype: brief.format === "instagram_story" ? "instagram_story_infographic" : "instagram_post_infographic",
        onScreenText: brief.hook,
        visualConcept,
        infographic: buildInfographicSpec(brief),
      },
    ];
  }

  if (brief.format === "instagram_carousel") {
    const bodySlideCount = Math.max(Math.min(brief.keyPoints.length, 4), 1);
    const slideCount = bodySlideCount + 2; // hook slide + body slide(s) + CTA slide
    const specs: DesignSpecification[] = [];

    for (let i = 0; i < slideCount; i++) {
      const isFirst = i === 0;
      const isLast = i === slideCount - 1;
      const onScreenText = isFirst
        ? brief.hook
        : isLast
        ? brief.cta
        : brief.keyPoints[i - 1] || brief.coreMessage;

      specs.push({
        renderMode,
        aspectRatio,
        subtype: isFirst ? "carousel_slide_hook" : isLast ? "carousel_slide_cta" : "carousel_slide_body",
        onScreenText,
        visualConcept,
        slideIndex: i,
        slideCount,
      });
    }
    return specs;
  }

  const subtype = brief.format === "instagram_story" ? "instagram_story" : "instagram_post";
  return [
    {
      renderMode,
      aspectRatio,
      subtype,
      onScreenText: brief.hook,
      visualConcept,
    },
  ];
}

function toImageRequest(brief: ICreativeBrief, spec: DesignSpecification): ImageGenerationRequest {
  return {
    format: brief.format,
    subtype: spec.subtype,
    aspectRatio: spec.aspectRatio,
    topic: brief.topic,
    hook: brief.hook,
    coreMessage: brief.coreMessage,
    keyPoints: brief.keyPoints,
    cta: brief.cta,
    onScreenText: spec.onScreenText,
    visualConcept: spec.visualConcept,
    brandContext: brief.brandContext,
    slideIndex: spec.slideIndex,
    slideCount: spec.slideCount,
    infographic: spec.infographic,
  };
}

async function markItemGenerating(item: IContentItem): Promise<void> {
  item.status = "generating";
  await item.save();
}

async function markItemOutcome(item: IContentItem, succeeded: boolean): Promise<void> {
  item.status = succeeded ? "generated" : "failed";
  await item.save();
}

/**
 * Full Graphic Engine pipeline: Creative Brief -> Visual Concept -> Design
 * Specification(s) -> Image Generation -> Brand Validation -> Creative
 * Asset(s). One image request per slide for carousels, one for everything
 * else. Runs synchronously today (see GenerationJob docs), but always goes
 * through the job model so the API/DB shape is ready for an async provider
 * later.
 */
export async function generateGraphic(
  userId: string,
  contentPlanId: unknown,
  contentItemId: unknown,
  graphicStyle: GraphicStyle = "standard"
) {
  const { plan, item, brief } = await prepareGeneration(userId, contentPlanId, contentItemId, "graphic");

  const provider = getImageProvider();

  const job = await createJob({
    organizationId: plan.organizationId,
    contentPlanId: plan._id as Types.ObjectId,
    contentItemId: item._id as Types.ObjectId,
    creativeBriefId: brief._id as Types.ObjectId,
    assetType: "graphic",
    request: { format: item.format, graphicStyle },
    provider: provider.name,
  });

  await markJobProcessing(job);
  await markItemGenerating(item);

  const visualConcept = buildVisualConcept(brief);
  const designSpecs = buildDesignSpecs(brief, visualConcept, graphicStyle);

  const assets: ICreativeAsset[] = [];
  try {
    for (const spec of designSpecs) {
      const result = await provider.generate(toImageRequest(brief, spec));
      const validation = validateGraphicAsset(brief, result);

      const asset = await CreativeAsset.create({
        organizationId: plan.organizationId,
        contentPlanId: plan._id,
        contentItemId: item._id,
        creativeBriefId: brief._id,
        generationJobId: job._id,
        type: "graphic",
        subtype: spec.subtype,
        format: item.format,
        provider: result.provider,
        providerModel: result.model,
        providerAssetId: result.providerAssetId,
        url: result.url,
        storageKey: result.providerAssetId,
        mimeType: result.mimeType,
        metadata: { width: result.width, height: result.height, mimeType: result.mimeType, isMock: result.isMock },
        generationConfig: { renderMode: spec.renderMode, aspectRatio: spec.aspectRatio, slideIndex: spec.slideIndex, graphicStyle },
        validation,
        status: validation.passed ? "validated" : "generated",
      });
      assets.push(asset);
    }

    if (assets[0]?.providerModel) {
      job.providerModel = assets[0].providerModel;
    }
    await markItemOutcome(item, true);
    await completeJob(
      job,
      assets.map((asset) => asset._id as Types.ObjectId)
    );

    return { plan, item, brief, job, assets };
  } catch (error) {
    await markItemOutcome(item, false);
    const message = error instanceof Error ? error.message : String(error);
    await failJob(job, message);
    if (error instanceof GenerationProviderError || error instanceof ContentStudioConfigurationError) {
      throw error;
    }
    throw new GenerationProviderError(provider.name, message);
  }
}
