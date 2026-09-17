import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches engagement metrics for a published piece of
 * Instagram content via the connected Meta integration.
 *
 * Read-only — no Content lifecycle check and no IntegrationExecution
 * record, since nothing is being mutated externally.
 */

const getInstagramContentMetricsTool = {
  name: "get_instagram_content_metrics",
  description:
    "Fetches engagement metrics for a published piece of Instagram content",

  async execute(input, context) {
    const { mediaId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("meta");
      const metrics = await adapter.getContentMetrics(mediaId);
      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getInstagramContentMetricsTool;
