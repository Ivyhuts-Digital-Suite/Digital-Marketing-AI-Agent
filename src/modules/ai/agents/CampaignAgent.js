import toolRegistry from "../tools/ToolRegistry.js";
import "../../integrations/tools/registerIntegrationTools.js";
import "../../integrations/adapters/registerIntegrationAdapters.js";

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
    // input.step?.toolName or input.toolName tells us which registered tool to invoke
    const toolName = input.toolName || input.step?.toolName;
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

    const result = await tool.execute({ params: input.params || {} }, context);

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
