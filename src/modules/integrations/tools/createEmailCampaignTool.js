import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: creates a new email marketing campaign.
 *
 * No IntegrationExecution record for this MVP — createCampaign here
 * just triggers a mock/draft campaign, not a real send.
 */

const createEmailCampaignTool = {
  name: "create_email_campaign",
  description: "Creates a new email marketing campaign",

  async execute(input, context) {
    try {
      const adapter = integrationAdapterFactory.get("email");
      const campaign = await adapter.createCampaign(input.params);
      return { success: true, data: campaign };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default createEmailCampaignTool;
