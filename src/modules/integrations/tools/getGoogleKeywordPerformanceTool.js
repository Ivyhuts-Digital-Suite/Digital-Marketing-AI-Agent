import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches keyword performance data for a Google Ads campaign.
 *
 * Read-only — no Content lifecycle check and no IntegrationExecution
 * record, since nothing is being mutated externally.
 */

const getGoogleKeywordPerformanceTool = {
  name: "get_google_keyword_performance",
  description: "Fetches keyword performance data for a Google Ads campaign",

  async execute(input, context) {
    const { campaignId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("google_ads");
      const performance = await adapter.getKeywordPerformance(campaignId);
      return { success: true, data: performance };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getGoogleKeywordPerformanceTool;
