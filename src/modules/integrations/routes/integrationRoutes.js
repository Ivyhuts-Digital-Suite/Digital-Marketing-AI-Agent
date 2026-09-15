import express from "express";

import IntegrationAccount from "../../../../models/integrationAccount.model.js";
import Integration from "../../../../models/integration.model.js";
import toolRegistry from "../../ai/tools/ToolRegistry.js";
import { processWebhook } from "../services/WebhookService.js";
import "../adapters/registerIntegrationAdapters.js";
import "../tools/registerIntegrationTools.js";

const router = express.Router();

/**
 * GET / — list all Integrations for an organization.
 */
router.get("/", async (req, res) => {
  const { organizationId } = req.query;
  if (!organizationId) {
    return res.status(400).json({ error: "organizationId query parameter is required" });
  }

  const integrations = await Integration.find({ organizationId });
  return res.json({ integrations });
});

/**
 * GET /:id — fetch a single Integration by id.
 */
router.get("/:id", async (req, res) => {
  const integration = await Integration.findById(req.params.id);
  if (!integration) {
    return res.status(404).json({ error: "Integration not found" });
  }

  return res.json({ integration });
});

/**
 * DELETE /:id — delete an Integration by id.
 */
router.delete("/:id", async (req, res) => {
  const integration = await Integration.findByIdAndDelete(req.params.id);
  if (!integration) {
    return res.status(404).json({ error: "Integration not found" });
  }

  return res.json({ success: true });
});

/**
 * POST /meta/connect — mock OAuth connect flow.
 *
 * This is a mock connect flow — there is no real Meta OAuth redirect
 * here, since no Meta app credentials exist yet. It just creates an
 * active IntegrationAccount directly. Replace with a real OAuth
 * authorization-code exchange once credentials exist.
 */
router.post("/meta/connect", async (req, res) => {
  const { organizationId, integrationId } = req.body;

  const account = await IntegrationAccount.create({
    organizationId,
    integrationId,
    provider: "meta",
    externalAccountId: `mock_acct_${Date.now()}`,
    status: "active"
  });

  return res.status(201).json({ account });
});

/**
 * GET /meta/profile — fetches the connected Instagram account's profile,
 * delegating to the get_instagram_profile tool.
 */
router.get("/meta/profile", async (req, res) => {
  const { integrationAccountId } = req.query;
  if (!integrationAccountId) {
    return res
      .status(400)
      .json({ error: "integrationAccountId query parameter is required" });
  }

  const tool = toolRegistry.getByName("get_instagram_profile");
  const result = await tool.execute({ params: { integrationAccountId } }, {});

  if (!result.success) {
    return res.status(502).json(result);
  }

  return res.json(result);
});

const FORMAT_TO_TOOL_NAME = {
  post: "publish_instagram_post",
  carousel: "publish_instagram_carousel",
  reel: "publish_instagram_reel"
};

/**
 * POST /instagram/publish — publishes content via the tool matching
 * req.body.format.
 */
router.post("/instagram/publish", async (req, res) => {
  try {
    const toolName = FORMAT_TO_TOOL_NAME[req.body.format];
    if (!toolName) {
      return res
        .status(400)
        .json({ error: `Unsupported format: "${req.body.format}"` });
    }

    const tool = toolRegistry.getByName(toolName);
    const result = await tool.execute(
      { params: req.body },
      { organizationId: req.body.organizationId, runId: "api" }
    );

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /instagram/schedule — schedules content for future publishing.
 */
router.post("/instagram/schedule", async (req, res) => {
  try {
    const tool = toolRegistry.getByName("schedule_instagram_content");
    const result = await tool.execute(
      { params: req.body },
      { organizationId: req.body.organizationId, runId: "api" }
    );

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /instagram/metrics — fetches engagement metrics for a piece of
 * published content.
 */
router.get("/instagram/metrics", async (req, res) => {
  try {
    const { mediaId } = req.query;
    if (!mediaId) {
      return res.status(400).json({ error: "mediaId query parameter is required" });
    }

    const tool = toolRegistry.getByName("get_instagram_content_metrics");
    const result = await tool.execute({ params: { mediaId } }, {});

    return res.status(result.success ? 200 : 502).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /meta/webhook — receives inbound Meta webhook events.
 *
 * Not part of the original spec, but added since nothing else in this
 * router calls processWebhook (imported to satisfy the router's given
 * dependency list) or gives Meta anywhere to actually deliver events.
 * Uses Meta's real header name for the payload signature.
 */
router.post("/meta/webhook", async (req, res) => {
  const result = await processWebhook({
    provider: "meta",
    rawPayload: req.body,
    signatureHeader: req.headers["x-hub-signature-256"]
  });

  if (!result.success) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

export default router;
