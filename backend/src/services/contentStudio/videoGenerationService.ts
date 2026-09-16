import { Types } from "mongoose";
import CreativeAsset, { ICreativeAsset } from "../../models/CreativeAsset";
import ContentItem, { IContentItem } from "../../models/ContentItem";
import ContentPlan, { IContentPlan } from "../../models/ContentPlan";
import CreativeBrief, { ICreativeBrief } from "../../models/CreativeBrief";
import { IGenerationJob } from "../../models/GenerationJob";
import GenerationJob from "../../models/GenerationJob";
import { validateVideoAsset } from "./brandValidationService";
import { prepareGeneration } from "./contentGenerationRouter.service";
import { MotionGraphicScene, VideoScript, VideoStyle } from "./contentStudio.types";
import { ContentStudioConfigurationError, GenerationInProgressError, GenerationProviderError, MediaProviderError } from "./errors";
import { completeJob, createJob, failJob, markJobAwaitingProvider, markJobProcessing } from "./generationJobService";
import { getVideoProvider } from "./providers/videoProviderFactory";
import { VideoGenerationResult } from "./providers/videoProvider.interface";
import { buildStoryboard, generateVideoScript } from "./videoScriptService";

const DEFAULT_VIDEO_TIMEOUT_MS = 15 * 60 * 1000;

function videoTimeoutMs(): number {
  const configured = Number(process.env.GEMINI_VIDEO_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_VIDEO_TIMEOUT_MS;
}

async function markItemGenerating(item: IContentItem): Promise<void> {
  item.generationStatus = "generating";
  await item.save();
}

async function markItemOutcome(item: IContentItem, succeeded: boolean): Promise<void> {
  item.generationStatus = succeeded ? "generated" : "failed";
  await item.save();
}

/** Shared by both the synchronous completion path (mock provider) and the async poll-completion path (Gemini/Veo) - a video is "done" the same way regardless of how long it took to get there. */
async function persistVideoAsset(
  plan: IContentPlan,
  item: IContentItem,
  brief: ICreativeBrief,
  job: IGenerationJob,
  script: VideoScript | undefined,
  scenes: MotionGraphicScene[],
  result: VideoGenerationResult
): Promise<ICreativeAsset> {
  // A storyboard, SVG, JSON manifest, data URL, or empty file must never
  // satisfy the final video step. The provider has already written the file
  // through FileStorageService; this is the last durable safety boundary
  // before a job can become completed.
  if (result.isMock || result.mimeType.toLowerCase() !== "video/mp4" || !result.url || result.url.startsWith("data:")) {
    throw new GenerationProviderError(result.provider, "VIDEO_ASSET_INVALID: provider output is not a real MP4 video.");
  }
  const validation = validateVideoAsset(brief, scenes, result);

  // Phase 9 - Step 13: same versioning link as graphicGenerationService.ts.
  const previousAsset = await CreativeAsset.findOne({ contentItemId: item._id, type: "video" }).sort({ createdAt: -1 });

  const asset = await CreativeAsset.create({
    organizationId: plan.organizationId,
    contentPlanId: plan._id,
    contentItemId: item._id,
    creativeBriefId: brief._id,
    generationJobId: job._id,
    previousAssetId: previousAsset?._id,
    regenerationReason: previousAsset ? item.reviewComment : undefined,
    type: "video",
    subtype: "instagram_reel",
    format: item.format,
    provider: result.provider,
    providerModel: result.model,
    providerAssetId: result.providerAssetId,
    url: result.url,
    storageKey: result.providerAssetId,
    mimeType: result.mimeType,
    metadata: { durationSeconds: result.durationSeconds, mimeType: "video/mp4", isMock: false, assetKind: "generated_video" },
    generationConfig: { script, scenes, aspectRatio: brief.visualDirection.aspectRatio },
    validation,
    status: validation.passed ? "validated" : "generated",
  });

  await markItemOutcome(item, true);
  await completeJob(job, [asset._id as Types.ObjectId]);
  return asset;
}

/**
 * Full Motion Graphic Video Engine pipeline: Creative Brief -> Script ->
 * Storyboard/Scene Plan -> Video Generation Provider -> Brand Validation ->
 * Creative Asset. Prioritizes Instagram Reels for this MVP - the structured
 * MotionGraphicScene[] plan is format-agnostic, so explainers/product/
 * promotional/educational videos are the same pipeline with a different
 * scene count/duration once those formats are added to the router.
 *
 * A synchronous provider (mock) completes within this call, same as
 * before. A genuinely async provider (Gemini/Veo) only SUBMITS the job here
 * and returns with `assets: []` and the job still "processing" -
 * pollAsyncVideoJob (invoked from GET /jobs/:jobId) is what finalizes it.
 */
export async function generateVideo(
  userId: string,
  contentPlanId: unknown,
  contentItemId: unknown,
  videoStyle: VideoStyle = "motion_graphic"
) {
  const { plan, item, brief } = await prepareGeneration(userId, contentPlanId, contentItemId, "video");

  const activeJob = await GenerationJob.exists({ contentItemId: item._id, assetType: "video", status: { $in: ["queued", "processing"] } });
  if (activeJob) throw new GenerationInProgressError();

  const provider = getVideoProvider();

  const job = await createJob({
    organizationId: plan.organizationId,
    contentPlanId: plan._id as Types.ObjectId,
    contentItemId: item._id as Types.ObjectId,
    creativeBriefId: brief._id as Types.ObjectId,
    assetType: "video",
    request: { format: item.format, videoStyle },
    provider: provider.name,
  });

  await markJobProcessing(job);
  await markItemGenerating(item);

  const script = generateVideoScript(brief, videoStyle);
  const scenes = buildStoryboard(brief, script);

  try {
    const outcome = await provider.generate({
      format: brief.format,
      subtype: "instagram_reel",
      aspectRatio: brief.visualDirection.aspectRatio,
      totalDuration: script.totalDuration,
      videoStyle,
      scenes,
      cta: brief.cta,
      brandContext: brief.brandContext,
    });

    if (outcome.status === "processing") {
      await markJobAwaitingProvider(job, {
        model: outcome.model,
        providerJobId: outcome.providerJobId,
        providerOperationState: outcome.providerOperationState,
      });
      // Carried on the job so pollAsyncVideoJob can finalize without
      // re-running script/storyboard generation later.
      job.request = { ...job.request, script, scenes };
      await job.save();

      return { plan, item, brief, job, script, scenes, assets: [] as ICreativeAsset[] };
    }

    const asset = await persistVideoAsset(plan, item, brief, job, script, scenes, outcome.result);
    return { plan, item, brief, job, script, scenes, assets: [asset] };
  } catch (error) {
    await markItemOutcome(item, false);
    const message = error instanceof Error ? error.message : String(error);
    await failJob(job, message);
    // Preserve typed provider failures so the controller can return their
    // real semantics (for example 429 quota/rate limit) instead of hiding
    // every upstream condition behind a generic 502.
    if (error instanceof GenerationProviderError || error instanceof ContentStudioConfigurationError || error instanceof MediaProviderError) {
      throw error;
    }
    throw new GenerationProviderError(provider.name, message);
  }
}

/**
 * Advances one async video job by polling its provider. Called from
 * GET /jobs/:jobId (see contentStudio.controller.ts) whenever a job is
 * still "processing" and carries providerOperationState - this is the
 * "GET /jobs/:jobId returns progress/status" half of the polling
 * architecture described in the Content Engine spec (Part C/15). Idempotent:
 * repeated calls while the provider is still working just refresh state.
 */
export async function pollAsyncVideoJob(job: IGenerationJob): Promise<IGenerationJob> {
  if (job.assetType !== "video" || job.status !== "processing" || !job.providerOperationState) {
    return job;
  }

  const provider = getVideoProvider();
  if (!provider.isAsync || !provider.checkStatus) {
    return job;
  }

  const [plan, item, brief] = await Promise.all([
    ContentPlan.findById(job.contentPlanId),
    ContentItem.findById(job.contentItemId),
    CreativeBrief.findById(job.creativeBriefId),
  ]);
  if (!plan || !item || !brief) {
    return job;
  }

  if (job.startedAt && Date.now() - job.startedAt.getTime() > videoTimeoutMs()) {
    const message = "Gemini Veo generation timed out before producing a video.";
    await markItemOutcome(item, false);
    await failJob(job, message);
    return job;
  }

  try {
    const outcome = await provider.checkStatus(job.providerOperationState);

    if (outcome.status === "processing") {
      job.providerOperationState = outcome.providerOperationState;
      job.progress = Math.max(job.progress, 60);
      await job.save();
      return job;
    }

    const scenes = (job.request?.scenes as MotionGraphicScene[] | undefined) ?? [];
    const script = job.request?.script as VideoScript | undefined;
    await persistVideoAsset(plan, item, brief, job, script, scenes, outcome.result);
    return job;
  } catch (error) {
    await markItemOutcome(item, false);
    const message = error instanceof Error ? error.message : String(error);
    await failJob(job, message);
    return job;
  }
}
