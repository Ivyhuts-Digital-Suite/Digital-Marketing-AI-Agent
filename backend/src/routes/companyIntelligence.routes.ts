import { Router } from "express";
import { generateCompanyIntelligence } from "../controllers/companyIntelligence.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireOrganizationMembership } from "../middleware/organization.middleware";

const router = Router();

router.post("/generate", authenticate, requireOrganizationMembership("body"), generateCompanyIntelligence);

export default router;
