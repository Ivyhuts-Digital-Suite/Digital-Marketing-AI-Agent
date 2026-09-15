import toolRegistry from "../tools/ToolRegistry.js";
import Content from "../../../../models/content.model.js";
import "../../integrations/tools/registerIntegrationTools.js";
import "../../integrations/adapters/registerIntegrationAdapters.js";

/**
 * Maps a Content document's contentType to the integration tool that
 * publishes it. Used as a fallback when no explicit toolName is given.
 */
const CONTENT_TYPE_TO_TOOL_NAME = {
  post: "publish_instagram_post",
  carousel: "publish_instagram_carousel",
  reel: "publish_instagram_reel"
};

/**
 * @file CampaignAgent — executes marketing campaign actions by
 * delegating to registered integration tools.
 *
 * This agent never calls provider APIs directly; it only knows how to
 * look up a tool by name in the ToolRegistry and invoke it, keeping
 * provider-specific logic (Meta Graph API calls, etc.) entirely inside
 * the tools/adapters layer.
 */

/**
 * @type {import("../types/agent.types.js").Agent}
 */
const CampaignAgent = {
  name: "CampaignAgent",
  description:
    "Executes marketing campaign actions (publishing, scheduling) by delegating to registered integration tools — never calls provider APIs directly",
  capabilities: ["publish_content", "schedule_content", "campaign_execution"],

  async run(input, context) {
    const params = input.params || input.step?.params || {};

    // input.step?.toolName or input.toolName tells us which registered tool to invoke
    let toolName = input.toolName || input.step?.toolName;

    // Fall back to inferring the tool from the content's own contentType
    // when no explicit toolName was given.
    if (!toolName && params.contentItemId) {
      const content = await Content.findById(params.contentItemId);
      toolName = CONTENT_TYPE_TO_TOOL_NAME[content?.contentType];
    }

    if (!toolName) {
      throw {
        code: "MISSING_DATA",
        message: "CampaignAgent requires a toolName to know which action to perform",
        retryable: false
      };
    }

    const tool = toolRegistry.getByName(toolName);
    if (!tool) {
      throw {
        code: "MISSING_DATA",
        message: `No tool registered with name "${toolName}"`,
        retryable: false
      };
    }

    const result = await tool.execute({ params }, context);

    if (!result.success) {
      // Surface tool failures as thrown errors so ExecutionEngine's retry logic can evaluate them
      throw {
        code: "TOOL_EXECUTION_FAILED",
        message: result.error,
        retryable: false
      };
    }

    return result.data;
  }
};

export default CampaignAgent;
