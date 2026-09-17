import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: segments an email audience based on given criteria.
 *
 * No IntegrationExecution record for this MVP — nothing external is
 * durably mutated by a segmentation query.
 */

const segmentEmailAudienceTool = {
  name: "segment_email_audience",
  description: "Segments an email audience based on given criteria",

  async execute(input, context) {
    try {
      const adapter = integrationAdapterFactory.get("email");
      const segment = await adapter.segmentAudience(input.params);
      return { success: true, data: segment };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default segmentEmailAudienceTool;
