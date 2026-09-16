import { Router } from "express";
import { createOrganization, listMyOrganizations } from "../controllers/organization.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, listMyOrganizations);
router.post("/", authenticate, createOrganization);

export default router;
