import { Router } from "express";
import {
  getFinding,
  getMetrics,
  getMetricsForCampaign,
  getMetricsForContent,
  getOverview,
  listFindings,
} from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/overview/:orgId", authenticate, getOverview);
router.get("/metrics/:orgId", authenticate, getMetrics);
router.get("/metrics/:orgId/content/:contentItemId", authenticate, getMetricsForContent);
router.get("/metrics/:orgId/campaign/:campaignId", authenticate, getMetricsForCampaign);
router.get("/findings/:orgId", authenticate, listFindings);
router.get("/findings/:orgId/:findingId", authenticate, getFinding);

export default router;
