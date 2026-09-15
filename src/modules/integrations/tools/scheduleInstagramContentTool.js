import Content from "../../../../models/content.model.js";
import IntegrationExecution from "../../../../models/integrationExecution.model.js";
import { logIntegrationAction } from "../services/AuditService.js";

/**
 * @file Tool: schedules an approved piece of Instagram content for
 * future publishing.
 *
 * Unlike the publish tools, this doesn't call an external provider yet —
 * there is no scheduling job/worker system in place to actually fire the
 * publish at scheduledAt. It only updates the Content document itself
 * (status + scheduledAt), which already supports this per its schema.
 *
 * Direct model imports (not the models/index.js barrel) are used here
 * deliberately, due to the known user.model.js/researchSource.model.js
 * OverwriteModelError bug flagged earlier in this project.
 */

const scheduleInstagramContentTool = {
  name: "schedule_instagram_content",
  description:
    "Schedules an approved piece of Instagram content for future publishing",

  async execute(input, context) {
    const {
      contentItemId,
      integrationAccountId,
      scheduledAt,
      scheduledTimezone,
      idempotencyKey
    } = input.params;

    const content = await Content.findById(contentItemId);
    if (!content) {
      return { success: false, error: "INVALID_CONTENT: content item not found" };
    }

    if (content.status !== "approved") {
      return {
        success: false,
        error: `INVALID_LIFECYCLE_STATE: content status is "${content.status}", must be APPROVED to schedule`
      };
    }

    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      return {
        success: false,
        error: "INVALID_SCHEDULE: scheduledAt must be a valid future date"
      };
    }

    if (!scheduledTimezone) {
      return {
        success: false,
        error: "INVALID_SCHEDULE: scheduledTimezone is required"
      };
    }

    let execution;
    try {
      execution = await IntegrationExecution.create({
        organizationId: context.organizationId,
        integrationAccountId,
        operation: "schedule_instagram_content",
        toolName: "schedule_instagram_content",
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
      content.status = "scheduled";
      content.scheduledAt = new Date(scheduledAt);
      await content.save();

      execution.status = "completed";
      execution.responseMetadata = {
        scheduledAt: content.scheduledAt,
        scheduledTimezone
      };
      execution.completedAt = new Date();
      await execution.save();

      await logIntegrationAction({
        organizationId: context.organizationId,
        actorType: "agent",
        actorId: context.runId || "unknown",
        action: "schedule_instagram_content",
        entityType: "Content",
        entityId: contentItemId,
        newState: {
          status: "scheduled",
          scheduledAt: content.scheduledAt
        },
        metadata: { integrationAccountId, idempotencyKey, scheduledTimezone }
      });

      return {
        success: true,
        data: {
          contentItemId,
          scheduledAt: content.scheduledAt,
          scheduledTimezone
        }
      };
    } catch (error) {
      execution.status = "failed";
      execution.errorMessage = error.message;
      execution.completedAt = new Date();
      await execution.save();

      return { success: false, error: `SCHEDULING_ERROR: ${error.message}` };
    }
  }
};

export default scheduleInstagramContentTool;
