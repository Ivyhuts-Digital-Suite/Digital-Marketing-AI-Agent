import { Router } from "express";
import { generateCompanyIntelligence } from "../controllers/companyIntelligence.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/generate", authenticate, generateCompanyIntelligence);

export default router;
