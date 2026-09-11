import Company from "../../../models/company.model.js";
import BrandProfile from "../../../models/brandProfile.model.js";

/**
 * @file Builds the ambient AgentContext for a run from company and brand data.
 *
 * Resilient by design: a missing or failed Company/BrandProfile fetch
 * degrades that section of the context to null rather than throwing — a
 * missing brand profile shouldn't block the whole run.
 */

const COMPANY_FIELDS = "name industry businessModel targetMarkets description";
const BRAND_FIELDS =
  "brandName tagline toneOfVoice targetAudience values keywords";

/**
 * Parameters for building an agent's run context.
 * @typedef {Object} BuildContextParams
 * @property {string} organizationId - Organization the run is scoped to.
 * @property {string} [companyId] - Company to pull brand/company context for.
 */

/**
 * The assembled context handed to an agent for a run.
 * @typedef {Object} AgentRunContext
 * @property {{ organizationId: string }} organization - Organization scope.
 * @property {Object|null} company - Company summary, or null if unavailable.
 * @property {Object|null} brand - Brand profile summary, or null if unavailable.
 * @property {{ builtAt: Date }} metadata - Context build metadata.
 */

/**
 * Assembles the {@link import("../types/agent.types.js").AgentContext}-shaped
 * context object for a run, pulling in company and brand data when a
 * companyId is given.
 * @param {BuildContextParams} params
 * @returns {Promise<AgentRunContext>} The assembled context.
 */
export async function buildContext({ organizationId, companyId }) {
  let company = null;
  let brand = null;

  if (companyId) {
    try {
      const companyDoc = await Company.findById(companyId).select(
        COMPANY_FIELDS
      );

      if (companyDoc) {
        company = {
          name: companyDoc.name,
          industry: companyDoc.industry,
          businessModel: companyDoc.businessModel,
          targetMarkets: companyDoc.targetMarkets,
          description: companyDoc.description
        };
      }
    } catch (error) {
      console.error("buildContext: failed to fetch Company:", error);
    }

    try {
      const brandDoc = await BrandProfile.findOne({ companyId }).select(
        BRAND_FIELDS
      );

      if (brandDoc) {
        brand = {
          brandName: brandDoc.brandName,
          tagline: brandDoc.tagline,
          toneOfVoice: brandDoc.toneOfVoice,
          targetAudience: brandDoc.targetAudience,
          values: brandDoc.values,
          keywords: brandDoc.keywords
        };
      }
    } catch (error) {
      console.error("buildContext: failed to fetch BrandProfile:", error);
    }
  }

  return {
    organization: { organizationId },
    company,
    brand,
    metadata: { builtAt: new Date() }
  };
}
