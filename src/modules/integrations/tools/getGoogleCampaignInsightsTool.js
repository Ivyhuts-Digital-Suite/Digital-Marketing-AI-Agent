import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches performance insights for a Google Ads campaign.
 *
 * Read-only — no Content lifecycle check and no IntegrationExecution
 * record, since nothing is being mutated externally.
 */

const getGoogleCampaignInsightsTool = {
  name: "get_google_campaign_insights",
  description: "Fetches performance insights for a Google Ads campaign",

  async execute(input, context) {
    const { campaignId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("google_ads");
      const insights = await adapter.getCampaignInsights(campaignId);
      return { success: true, data: insights };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getGoogleCampaignInsightsTool;
