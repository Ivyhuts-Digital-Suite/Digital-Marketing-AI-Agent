import { Router } from "express";
import {
  generateContentPlan,
  getContentGaps,
  getContentPlan,
  listContentPlans,
} from "../controllers/contentIntelligence.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/plans", authenticate, generateContentPlan);
router.get("/plans/:organizationId", authenticate, listContentPlans);
router.get("/plans/:organizationId/:planId", authenticate, getContentPlan);
router.get("/gaps/:organizationId", authenticate, getContentGaps);

export default router;
