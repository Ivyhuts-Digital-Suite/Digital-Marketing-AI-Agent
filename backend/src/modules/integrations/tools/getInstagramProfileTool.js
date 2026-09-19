import integrationAdapterFactory from "../adapters/IntegrationAdapterFactory.js";

/**
 * @file Tool: fetches the connected Instagram account's profile
 * information via the connected Meta integration.
 *
 * Read-only — no Content lifecycle check and no IntegrationExecution
 * record, since nothing is being mutated externally.
 */

const getInstagramProfileTool = {
  name: "get_instagram_profile",
  description: "Fetches the connected Instagram account's profile information",

  async execute(input, context) {
    const { integrationAccountId } = input.params;

    try {
      const adapter = integrationAdapterFactory.get("meta");
      const profile = await adapter.getProfile(integrationAccountId);
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: `PROVIDER_ERROR: ${error.message}` };
    }
  }
};

export default getInstagramProfileTool;
