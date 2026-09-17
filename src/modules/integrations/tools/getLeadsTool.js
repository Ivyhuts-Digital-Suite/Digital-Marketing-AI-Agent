import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches leads from the connected CRM.
 *
 * Read-only — no IntegrationExecution record, since nothing is being
 * mutated externally.
 */

const getLeadsTool = {
  name: "get_leads",
  description: "Fetches leads from the connected CRM",

  async execute(input, context) {
    try {
      const adapter = integrationAdapterFactory.get("crm");
      const result = await adapter.getLeads(input.params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getLeadsTool;
