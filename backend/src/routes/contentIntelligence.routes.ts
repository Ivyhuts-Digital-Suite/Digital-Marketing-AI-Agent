import { Router } from "express";
import {
  finalizeContentPlan,
  generateContentPlan,
  getContentGaps,
  getContentPlan,
  listContentPlans,
} from "../controllers/contentIntelligence.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireOrganizationMembership } from "../middleware/organization.middleware";

const router = Router();

router.post("/plans", authenticate, requireOrganizationMembership("body"), generateContentPlan);
router.post("/plans/:planId/finalize", authenticate, requireOrganizationMembership("body"), finalizeContentPlan);
router.get("/plans/:organizationId", authenticate, requireOrganizationMembership("params"), listContentPlans);
router.get("/plans/:organizationId/:planId", authenticate, requireOrganizationMembership("params"), getContentPlan);
router.get("/gaps/:organizationId", authenticate, requireOrganizationMembership("params"), getContentGaps);

export default router;
