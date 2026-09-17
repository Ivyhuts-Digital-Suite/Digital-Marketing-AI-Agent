import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches revenue insights from the connected CRM.
 *
 * Read-only — no IntegrationExecution record, since nothing is being
 * mutated externally.
 */

const getRevenueTool = {
  name: "get_revenue",
  description: "Fetches revenue insights from the connected CRM",

  async execute(input, context) {
    const { period } = input.params || {};

    try {
      const adapter = integrationAdapterFactory.get("crm");
      const result = await adapter.getRevenue(period);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getRevenueTool;
