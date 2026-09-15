import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";
import Content from "../../../../models/content.model.js";
import IntegrationExecution from "../../../../models/integrationExecution.model.js";
import IntegrationAccount from "../../../../models/integrationAccount.model.js";
import { logIntegrationAction } from "../services/AuditService.js";
import IntegrationErrorCodes from "../errors/IntegrationErrorCodes.js";

/**
 * @file Tool: publishes an approved Instagram carousel via the connected
 * Meta integration.
 *
 * Direct model imports (not the models/index.js barrel) are used here
 * deliberately, due to the known user.model.js/researchSource.model.js
 * OverwriteModelError bug flagged earlier in this project.
 */

const publishInstagramCarouselTool = {
  name: "publish_instagram_carousel",
  description:
    "Publishes an approved Instagram carousel via the connected Meta integration",

  async execute(input, context) {
    const { contentItemId, integrationAccountId, idempotencyKey } = input.params;

    const content = await Content.findById(contentItemId);
    if (!content) {
      return {
        success: false,
        error: `${IntegrationErrorCodes.INVALID_CONTENT}: content item not found`
      };
    }

    const account = await IntegrationAccount.findById(integrationAccountId);
    if (!account || account.status !== "active") {
      return {
        success: false,
        error: `${IntegrationErrorCodes.NOT_CONNECTED}: no active Instagram integration account found`
      };
    }

    if (content.status !== "approved") {
      return {
        success: false,
        error: `${IntegrationErrorCodes.INVALID_LIFECYCLE_STATE}: content status is "${content.status}", must be APPROVED to publish`
      };
    }

    let execution;
    try {
      execution = await IntegrationExecution.create({
        organizationId: context.organizationId,
        integrationAccountId,
        operation: "publish_instagram_carousel",
        toolName: "publish_instagram_carousel",
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
          error: `${IntegrationErrorCodes.DUPLICATE_OPERATION}: this operation was already executed`
        };
      }
      throw error;
    }

    try {
      const adapter = integrationAdapterFactory.get("meta");
      const result = await adapter.publishCarousel({ contentItemId });

      execution.status = "completed";
      execution.externalResourceId = result.externalResourceId;
      execution.responseMetadata = result;
      execution.completedAt = new Date();
      await execution.save();

      await logIntegrationAction({
        organizationId: context.organizationId,
        actorType: "agent",
        actorId: context.runId || "unknown",
        action: "publish_instagram_carousel",
        entityType: "Content",
        entityId: contentItemId,
        newState: {
          status: "published",
          externalResourceId: result.externalResourceId
        },
        metadata: { integrationAccountId, idempotencyKey }
      });

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

      return {
        success: false,
        error: `${IntegrationErrorCodes.PROVIDER_ERROR}: ${error.message}`
      };
    }
  }
};

export default publishInstagramCarouselTool;
