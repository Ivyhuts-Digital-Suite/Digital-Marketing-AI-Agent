import {
  createHypothesis,
  createExperiment,
  approveExperiment,
  scheduleExperiment,
  startExperiment,
  evaluateExperiment,
  cancelExperiment
} from "../modules/experimentation/ExperimentEngine.js";
import Experiment from "../models/experiment.model.js";

/**
 * @file experimentation.controller — Express handlers for the
 * experimentation pipeline, matching strategy.controller.ts's naming
 * convention (backend/src/controllers/<domain>.controller.*) but kept as
 * .js so it can import the ESM ExperimentEngine.js directly, without
 * crossing the TS/CommonJS boundary that the rest of backend/src has.
 *
 * organizationId is read from req.body on every handler: the existing
 * auth middleware's AuthPayload (backend/src/middleware/auth.middleware.ts)
 * only carries { id, role } on req.user, nothing organization-scoped, so
 * there is nothing to pull it from yet.
 */

export async function createHypothesisHandler(req, res) {
  try {
    const hypothesis = await createHypothesis({
      ...req.body,
      organizationId: req.body.organizationId
    });
    return res.status(201).json(hypothesis);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function createExperimentHandler(req, res) {
  try {
    const result = await createExperiment(req.body);
    if (result.success === false) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function approveExperimentHandler(req, res) {
  try {
    const result = await approveExperiment(req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function scheduleExperimentHandler(req, res) {
  try {
    const result = await scheduleExperiment({
      experimentId: req.params.id,
      ...req.body
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function startExperimentHandler(req, res) {
  try {
    const result = await startExperiment(req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function evaluateExperimentHandler(req, res) {
  try {
    const result = await evaluateExperiment({
      experimentId: req.params.id,
      ...req.body
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function cancelExperimentHandler(req, res) {
  try {
    const result = await cancelExperiment({
      experimentId: req.params.id,
      ...req.body
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getExperimentHandler(req, res) {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ error: "EXPERIMENT_NOT_FOUND" });
    }
    return res.status(200).json(experiment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
