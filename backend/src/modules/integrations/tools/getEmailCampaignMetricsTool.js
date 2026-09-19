import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches raw engagement metrics for an email campaign.
 *
 * Read-only — no IntegrationExecution record, since nothing is being
 * mutated externally.
 */

const getEmailCampaignMetricsTool = {
  name: "get_email_campaign_metrics",
  description: "Fetches raw engagement metrics for an email campaign",

  async execute(input, context) {
    const { campaignId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("email");
      const metrics = await adapter.getCampaignMetrics(campaignId);
      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getEmailCampaignMetricsTool;
