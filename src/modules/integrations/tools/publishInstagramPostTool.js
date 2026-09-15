import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";
import Content from "../../../../models/content.model.js";
import IntegrationExecution from "../../../../models/integrationExecution.model.js";

/**
 * @file Tool: publishes an approved piece of Instagram content via the
 * connected Meta integration.
 *
 * Direct model imports (not the models/index.js barrel) are used here
 * deliberately, due to the known user.model.js/researchSource.model.js
 * OverwriteModelError bug flagged earlier in this project.
 */

const publishInstagramPostTool = {
  name: "publish_instagram_post",
  description:
    "Publishes an approved Instagram post via the connected Meta integration",

  async execute(input, context) {
    const { contentItemId, integrationAccountId, idempotencyKey } = input.params;

    const content = await Content.findById(contentItemId);
    if (!content) {
      return { success: false, error: "INVALID_CONTENT: content item not found" };
    }

    if (content.status !== "approved") {
      return {
        success: false,
        error: `INVALID_LIFECYCLE_STATE: content status is "${content.status}", must be APPROVED to publish`
      };
    }

    let execution;
    try {
      execution = await IntegrationExecution.create({
        organizationId: context.organizationId,
        integrationAccountId,
        operation: "publish_instagram_post",
        toolName: "publish_instagram_post",
        contentItemId,
        actorType: "agent",
        actorId: context.runId || "unknown",
        idempotencyKey,
        status: "in_progress",
        startedAt: new Date()
      });
    } catch (error) {
      if (error.code === 11000) {
        return {
          success: false,
          error: "DUPLICATE_OPERATION: this operation was already executed"
        };
      }
      throw error;
    }

    try {
      const adapter = integrationAdapterFactory.get("meta");
      const result = await adapter.publishPost({ contentItemId });

      execution.status = "completed";
      execution.externalResourceId = result.externalResourceId;
      execution.responseMetadata = result;
      execution.completedAt = new Date();
      await execution.save();

      return {
        success: true,
        data: {
          externalResourceId: result.externalResourceId,
          publishedAt: result.publishedAt
        }
      };
    } catch (error) {
      execution.status = "failed";
      execution.errorMessage = error.message;
      execution.completedAt = new Date();
      await execution.save();

      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default publishInstagramPostTool;
