import express from "express";
import {
  createHypothesisHandler,
  createExperimentHandler,
  approveExperimentHandler,
  scheduleExperimentHandler,
  startExperimentHandler,
  evaluateExperimentHandler,
  cancelExperimentHandler,
  getExperimentHandler
} from "../controllers/experimentation.controller.js";

const router = express.Router();

router.post("/hypothesis", createHypothesisHandler);
router.post("/", createExperimentHandler);
router.get("/:id", getExperimentHandler);
router.post("/:id/approve", approveExperimentHandler);
router.post("/:id/schedule", scheduleExperimentHandler);
router.post("/:id/start", startExperimentHandler);
router.post("/:id/evaluate", evaluateExperimentHandler);
router.post("/:id/cancel", cancelExperimentHandler);

export default router;
