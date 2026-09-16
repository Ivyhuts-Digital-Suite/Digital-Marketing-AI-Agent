import { Router } from "express";
import {
  createCreativeBrief,
  generateGraphicHandler,
  generateVideoHandler,
  getAssetsForContentItem,
  getCreativeBrief,
  getGenerationJob,
  getProviderStatus,
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

export default router;
