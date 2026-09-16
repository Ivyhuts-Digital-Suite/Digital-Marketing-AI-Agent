import { Router } from "express";
import {
  approveContentHandler,
  archiveContentHandler,
  createCreativeBrief,
  generateGraphicHandler,
  generateVideoHandler,
  getAssetsForContentItem,
  getContentHistoryHandler,
  getCreativeBrief,
  getGenerationJob,
  getProviderStatus,
  getQualityCheckHandler,
  requestChangesHandler,
  runQualityCheckHandler,
  scheduleContentHandler,
  submitForReviewHandler,
} from "../controllers/contentStudio.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/briefs", authenticate, createCreativeBrief);
router.get("/briefs/:contentItemId", authenticate, getCreativeBrief);
router.post("/graphics/generate", authenticate, generateGraphicHandler);
router.post("/videos/generate", authenticate, generateVideoHandler);
router.get("/assets/:contentItemId", authenticate, getAssetsForContentItem);
router.get("/jobs/:jobId", authenticate, getGenerationJob);
router.get("/providers", authenticate, getProviderStatus);

// Phase 9: lifecycle / review / scheduling
router.post("/items/:contentItemId/submit-review", authenticate, submitForReviewHandler);
router.post("/items/:contentItemId/approve", authenticate, approveContentHandler);
router.post("/items/:contentItemId/request-changes", authenticate, requestChangesHandler);
router.post("/items/:contentItemId/archive", authenticate, archiveContentHandler);
router.get("/items/:contentItemId/history", authenticate, getContentHistoryHandler);
router.post("/items/:contentItemId/quality-check", authenticate, runQualityCheckHandler);
router.get("/items/:contentItemId/quality-check", authenticate, getQualityCheckHandler);
router.post("/items/:contentItemId/schedule", authenticate, scheduleContentHandler);

export default router;
