import ExperimentVariant from "../../../models/experimentVariant.model.js";
import CreativeBrief from "../../../models/creativeBrief.model.js";
import Content from "../../../models/content.model.js";
import { generateText } from "../../ai/content/TextEngine.js";

/**
 * @file VariantGeneratorService — connects the experimentation engine to
 * the real Content Studio (Phase 8).
 *
 * Per the roadmap's Section 13-15: "Experiments should use real
 * ContentItems. Don't create a separate experimental content system."
 * Each variant this produces is a real Content document with a real
 * CreativeBrief, generated through the same TextEngine used everywhere
 * else in the app — not a special experimental content path. This is
 * the piece that makes an ExperimentVariant.contentId reference an
 * actual, publishable Content document rather than a placeholder.
 */

const VALID_TYPES = ["control", "variant"];

/**
 * Generates real Content Studio content for one experiment arm and
 * links it into an ExperimentVariant.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.companyId
 * @param {string} params.experimentId
 * @param {"control"|"variant"} params.type
 * @param {string} params.hook
 * @param {string} params.coreMessage
 * @param {string} params.cta
 * @param {string} params.targetAudience
 * @param {string} [params.channel="instagram"]
 * @param {string} [params.format="post"]
 * @returns {Promise<Object>} { success: true, variant, content, creativeBrief, generatedText } or { success: false, error }.
 */
export async function generateVariantContent({
  organizationId,
  companyId,
  experimentId,
  type,
  hook,
  coreMessage,
  cta,
  targetAudience,
  channel = "instagram",
  format = "post"
}) {
  try {
    if (!VALID_TYPES.includes(type)) {
      return { success: false, error: "INVALID_VARIANT_TYPE" };
    }

    const content = await Content.create({
      organizationId,
      companyId,
      contentType: format,
      channel,
      status: "draft"
    });

    const creativeBrief = await CreativeBrief.create({
      organizationId,
      companyId,
      contentItemId: content._id,
      objective: `Experiment variant (${type})`,
      audience: targetAudience,
      platform: channel,
      format,
      coreMessage,
      hook,
      cta,
      generatedBy: "ai"
    });

    const generatedText = await generateText({
      format,
      creativeBrief: {
        format,
        hook,
        coreMessage,
        cta,
        audience: targetAudience,
        emotionalTone: "confident"
      }
    });

    content.creativeBriefId = creativeBrief._id;
    await content.save();

    const variant = await ExperimentVariant.create({
      organizationId,
      experimentId,
      type,
      name: type === "control" ? "Control" : "Variant",
      contentId: content._id,
      configuration: hook,
      allocationPercentage: 50
    });

    return { success: true, variant, content, creativeBrief, generatedText };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
