import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches the sales pipeline summary from the connected CRM.
 *
 * Read-only — no IntegrationExecution record, since nothing is being
 * mutated externally.
 */

const getPipelineTool = {
  name: "get_pipeline",
  description: "Fetches the sales pipeline summary from the connected CRM",

  async execute(input, context) {
    try {
      const adapter = integrationAdapterFactory.get("crm");
      const result = await adapter.getPipeline();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getPipelineTool;
