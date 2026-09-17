import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches computed performance rates for an email campaign.
 *
 * Read-only — no IntegrationExecution record, since nothing is being
 * mutated externally.
 */

const getEmailPerformanceTool = {
  name: "get_email_performance",
  description: "Fetches computed performance rates for an email campaign",

  async execute(input, context) {
    const { campaignId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("email");
      const performance = await adapter.getPerformance(campaignId);
      return { success: true, data: performance };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getEmailPerformanceTool;
