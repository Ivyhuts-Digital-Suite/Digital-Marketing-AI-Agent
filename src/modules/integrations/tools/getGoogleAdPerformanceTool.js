import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches performance data for a single Google Ads ad.
 *
 * Read-only — no Content lifecycle check and no IntegrationExecution
 * record, since nothing is being mutated externally.
 */

const getGoogleAdPerformanceTool = {
  name: "get_google_ad_performance",
  description: "Fetches performance data for a Google Ads ad",

  async execute(input, context) {
    const { adId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("google_ads");
      const performance = await adapter.getAdPerformance(adId);
      return { success: true, data: performance };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getGoogleAdPerformanceTool;
