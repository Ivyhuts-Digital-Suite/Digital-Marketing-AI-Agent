import { Request, Response } from "express";
import { generateCreativeBriefForRequest, getCreativeBriefForRequest } from "../services/contentStudio/creativeBriefService";
import { generateGraphic } from "../services/contentStudio/graphicGenerationService";
import { generateVideo } from "../services/contentStudio/videoGenerationService";
import { pollAsyncVideoJob } from "../services/contentStudio/videoGenerationService";
import { listAssetsForContentItem } from "../services/contentStudio/assetService";
import { getJobById } from "../services/contentStudio/generationJobService";
import { ContentPlanNotFoundError } from "../services/contentIntelligence/errors";
import { OrganizationAccessError } from "../middleware/organization.middleware";
import {
  ContentItemNotFoundError,
  ContentStudioConfigurationError,
  ContentStudioDatabaseError,
  ContentStudioLlmRequestError,
  CreativeBriefNotFoundError,
  FormatEngineMismatchError,
  GenerationJobNotFoundError,
  GenerationInProgressError,
  GenerationProviderError,
  MediaProviderError,
  InvalidContentStudioInputError,
  InvalidContentStudioLlmResponseError,
  PlanNotReadyForGenerationError,
  UnsupportedFormatForGenerationError,
} from "../services/contentStudio/errors";

/**
 * Content Studio's API responses consistently use the {success, message,
 * data} envelope requested for this module - existing controllers
 * (auth/companyIntelligence/contentIntelligence) keep their own established
 * response shapes untouched.
 */
function handleError(error: unknown, res: Response): void {
  if (error instanceof MediaProviderError) {
    const statusByCode: Partial<Record<typeof error.code, number>> = {
      MEDIA_PROVIDER_NOT_CONFIGURED: 503,
      MEDIA_PROVIDER_AUTH_FAILED: 401,
      MEDIA_PROVIDER_RATE_LIMITED: 429,
      MEDIA_PROVIDER_QUOTA_EXCEEDED: 402,
      MEDIA_PROVIDER_TIMEOUT: 504,
      MEDIA_PROVIDER_UNAVAILABLE: 503,
      MEDIA_STORAGE_FAILED: 502,
    };
    // Every MediaProviderError used to reach the client silently - codes not
    // in statusByCode (MEDIA_GENERATION_FAILED, MEDIA_OUTPUT_MISSING,
    // MEDIA_INVALID_REQUEST, MEDIA_CAPABILITY_NOT_SUPPORTED) fell through to
    // a bare 502 with nothing in the server log to explain why, making real
    // upstream failures indistinguishable from each other from the outside.
    console.error(`Content Studio Media Provider Error [${error.code}]:`, error.message);
    res.status(statusByCode[error.code] ?? 502).json({ success: false, code: error.code, message: error.message });
    return;
  }
  if (error instanceof OrganizationAccessError) {
    res.status(403).json({ success: false, message: "You do not have access to this organization" });
    return;
  }

  if (
    error instanceof InvalidContentStudioInputError ||
    error instanceof FormatEngineMismatchError ||
    error instanceof UnsupportedFormatForGenerationError
  ) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  if (
    error instanceof ContentPlanNotFoundError ||
    error instanceof ContentItemNotFoundError ||
    error instanceof CreativeBriefNotFoundError ||
    error instanceof GenerationJobNotFoundError
  ) {
    res.status(404).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof PlanNotReadyForGenerationError) {
    res.status(409).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof GenerationInProgressError) {
    res.status(409).json({ success: false, code: "VIDEO_GENERATION_IN_PROGRESS", message: error.message });
    return;
  }

  if (error instanceof ContentStudioConfigurationError) {
    console.error("Content Studio Configuration Error:", error.message);
    res.status(503).json({
      success: false,
      code: "GEMINI_NOT_CONFIGURED",
      message: "Gemini Veo is not configured. Add GEMINI_API_KEY and set MEDIA_VIDEO_PROVIDER=gemini.",
    });
    return;
  }

  if (
    error instanceof ContentStudioLlmRequestError ||
    error instanceof InvalidContentStudioLlmResponseError ||
    error instanceof GenerationProviderError
  ) {
    console.error("Content Studio Upstream Error:", error.message);
    res.status(502).json({ success: false, message: "Content studio generation failed upstream, please try again" });
    return;
  }

  if (error instanceof ContentStudioDatabaseError) {
    console.error("Content Studio Database Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
    return;
  }

  console.error("Content Studio Unexpected Error:", error);
  res.status(500).json({ success: false, message: "Server error" });
}

function readIds(req: Request): { contentPlanId: unknown; contentItemId: unknown } {
  return { contentPlanId: req.body?.contentPlanId, contentItemId: req.body?.contentItemId };
}

/** POST /api/content-studio/briefs */
export const createCreativeBrief = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentPlanId, contentItemId } = readIds(req);
    const brief = await generateCreativeBriefForRequest(req.user!.id, contentPlanId, contentItemId);
    res.status(201).json({ success: true, message: "Creative brief generated successfully", data: brief });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * GET /api/content-studio/briefs/:contentItemId
 *
 * A brief that hasn't been generated yet is not an error condition - it's
 * returned as `data: null` with a 200, the same way GET /assets/:contentItemId
 * returns an empty array rather than a 404 when nothing has been generated
 * yet. This lets the frontend treat "no brief yet" as normal query data
 * instead of a caught error.
 */
export const getCreativeBrief = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentItemId } = req.params;
    if (typeof contentItemId !== "string") {
      res.status(400).json({ success: false, message: "contentItemId is required" });
      return;
    }

    const brief = await getCreativeBriefForRequest(req.user!.id, contentItemId);

    if (!brief) {
      res.status(200).json({ success: true, message: "No creative brief exists yet for this content item", data: null });
      return;
    }

    res.status(200).json({ success: true, message: "Creative brief retrieved successfully", data: brief });
  } catch (error) {
    handleError(error, res);
  }
};

/** POST /api/content-studio/graphics/generate - optional body.graphicStyle: "standard" (default) | "infographic". */
export const generateGraphicHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentPlanId, contentItemId } = readIds(req);
    const graphicStyle = req.body?.graphicStyle === "infographic" ? "infographic" : "standard";
    const result = await generateGraphic(req.user!.id, contentPlanId, contentItemId, graphicStyle);
    res.status(201).json({
      success: true,
      message: "Graphic generation completed",
      data: { job: result.job, assets: result.assets, brief: result.brief },
    });
  } catch (error) {
    handleError(error, res);
  }
};

/** POST /api/content-studio/videos/generate - optional body.videoStyle: "motion_graphic" (default) | "cinematic". */
export const generateVideoHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentPlanId, contentItemId } = readIds(req);
    const videoStyle = req.body?.videoStyle === "cinematic" ? "cinematic" : "motion_graphic";
    const result = await generateVideo(req.user!.id, contentPlanId, contentItemId, videoStyle);
    res.status(201).json({
      success: true,
      message: "Video generation completed",
      data: { job: result.job, assets: result.assets, brief: result.brief, script: result.script, scenes: result.scenes },
    });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/content-studio/assets/:contentItemId */
export const getAssetsForContentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentItemId } = req.params;
    if (typeof contentItemId !== "string") {
      res.status(400).json({ success: false, message: "contentItemId is required" });
      return;
    }
    const assets = await listAssetsForContentItem(req.user!.id, contentItemId);
    res.status(200).json({ success: true, message: "Assets retrieved successfully", data: assets });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/content-studio/jobs/:jobId */
export const getGenerationJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    if (typeof jobId !== "string") {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }
    const job = await getJobById(req.user!.id, jobId);
    // A Veo operation is advanced only by the backend. The browser polls this
    // authenticated endpoint; it never receives an operation token or calls
    // Gemini directly.
    const updatedJob = await pollAsyncVideoJob(job);
    res.status(200).json({ success: true, message: "Generation job retrieved successfully", data: updatedJob });
  } catch (error) {
    handleError(error, res);
  }
};

/** Safe configuration visibility for the UI; no credential values are exposed. */
export const getProviderStatus = async (_req: Request, res: Response): Promise<void> => {
  const huggingFaceConfigured = Boolean(process.env.HUGGINGFACE_API_KEY?.trim());
  const imageModelConfigured = Boolean(process.env.HUGGINGFACE_IMAGE_MODEL?.trim());
  res.status(200).json({
    success: true,
    data: {
      gemini: { configured: Boolean(process.env.GEMINI_API_KEY?.trim()), role: "intelligence_and_veo_video", video: { available: Boolean(process.env.GEMINI_API_KEY?.trim()), provider: "gemini", model: process.env.GEMINI_VIDEO_MODEL?.trim() || "veo-3.1-generate-preview" } },
      huggingFace: {
        configured: huggingFaceConfigured,
        image: { available: huggingFaceConfigured && imageModelConfigured, provider: "huggingface", model: process.env.HUGGINGFACE_IMAGE_MODEL?.trim() || null },
        video: { available: huggingFaceConfigured, provider: "huggingface", model: process.env.HUGGINGFACE_VIDEO_MODEL?.trim() || "Wan-AI/Wan2.1-T2V-1.3B" },
      },
    },
  });
};
