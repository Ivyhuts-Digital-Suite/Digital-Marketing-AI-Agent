import { Router } from "express";
import {
  approveRecommendation,
  executeRecommendation,
  getRecommendation,
  listRecommendations,
  rejectRecommendation,
} from "../controllers/optimization.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/recommendations/:orgId", authenticate, listRecommendations);
router.get("/recommendations/:orgId/:recommendationId", authenticate, getRecommendation);
router.post("/recommendations/:id/approve", authenticate, approveRecommendation);
router.post("/recommendations/:id/reject", authenticate, rejectRecommendation);
router.post("/recommendations/:id/execute", authenticate, executeRecommendation);

export default router;
