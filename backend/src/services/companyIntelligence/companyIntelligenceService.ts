import mongoose, { Types } from "mongoose";
import CompanyIntelligence, { ICompanyIntelligence } from "../../models/CompanyIntelligence";
import BrandProfile, { IBrandProfile } from "../../models/BrandProfile";
import Product from "../../models/Product";
import Service from "../../models/Service";
import { ISourceReference } from "../../models/common/sourceReference";
import { InvalidOrganizationIdError, NoCompanyKnowledgeError, CompanyIntelligenceDatabaseError } from "./errors";
import { gatherCompanyIntelligenceContext } from "./companyIntelligenceContext";
import { requestCompanyIntelligenceFromLlm } from "./companyIntelligenceLlm";
import {
  CompanyIntelligenceContext,
  CompanyIntelligenceLlmResult,
  GenerateCompanyIntelligenceResult,
  LlmProductOrService,
} from "./types";

/**
 * Step 7: Company Intelligence Generator.
 *
 * organizationId -> gather bounded context from existing KnowledgeSources/
 * KnowledgeChunks -> ask the LLM to extract structured intelligence ->
 * validate the response -> upsert CompanyIntelligence + BrandProfile +
 * Product/Service records.
 *
 * Regeneration is safe to re-run: CompanyIntelligence and BrandProfile are
 * one document per organization (upserted, with a simple incrementing
 * `version` on CompanyIntelligence), and Products/Services are upserted
 * by (organizationId, name) so re-running with the same extracted names
 * updates existing records instead of creating duplicates.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSourceReferences(context: CompanyIntelligenceContext): ISourceReference[] {
  const refs: ISourceReference[] = context.excerpts.map((excerpt) => ({
    sourceType: excerpt.sourceType === "url" ? "website" : "document",
    sourceId: new Types.ObjectId(excerpt.sourceId),
    url: excerpt.url,
    label: excerpt.label,
  }));

  if (context.onboarding) {
    refs.unshift({ sourceType: "onboarding", label: "organization onboarding data" });
  }

  return refs;
}

async function upsertProductsOrServices(
  model: mongoose.Model<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  organizationId: string,
  items: LlmProductOrService[],
  sourceReferences: ISourceReference[]
): Promise<Types.ObjectId[]> {
  const ids: Types.ObjectId[] = [];

  for (const item of items) {
    const name = item.name.trim();
    if (name.length === 0) continue; // never persist a nameless product/service

    const doc = await model.findOneAndUpdate(
      { organizationId, name: new RegExp(`^${escapeRegExp(name)}$`, "i") },
      {
        $set: {
          name,
          description: item.description || undefined,
          targetAudience: item.targetAudience,
          problemsSolved: item.problemsSolved,
          benefits: item.benefits,
          differentiators: item.differentiators,
          sourceReferences,
        },
        $setOnInsert: { organizationId },
      },
      { upsert: true, new: true }
    );

    ids.push(doc._id);
  }

  return ids;
}

async function upsertCompanyIntelligence(
  organizationId: string,
  parsed: CompanyIntelligenceLlmResult,
  sourceReferences: ISourceReference[],
  productIds: Types.ObjectId[],
  serviceIds: Types.ObjectId[]
): Promise<ICompanyIntelligence> {
  const existing = await CompanyIntelligence.findOne({ organizationId });
  const nextVersion = existing ? existing.version + 1 : 1;

  const updated = await CompanyIntelligence.findOneAndUpdate(
    { organizationId },
    {
      $set: {
        companyOverview: parsed.companyOverview || undefined,
        industry: parsed.industry || undefined,
        targetCustomers: parsed.targetCustomers,
        customerProblems: parsed.customerProblems,
        products: productIds,
        services: serviceIds,
        differentiators: parsed.differentiators,
        competitors: parsed.competitors,
        valuePropositions: parsed.valuePropositions,
        brandVoice: parsed.brandVoice || undefined,
        marketingMessaging: parsed.marketingMessaging,
        allowedClaims: parsed.allowedClaims,
        forbiddenClaims: parsed.forbiddenClaims,
        importantFacts: parsed.importantFacts,
        sourceReferences,
        generatedAt: new Date(),
        version: nextVersion,
      },
      $setOnInsert: { organizationId },
    },
    { upsert: true, new: true }
  );

  return updated as ICompanyIntelligence;
}

async function upsertBrandProfile(
  organizationId: string,
  parsed: CompanyIntelligenceLlmResult,
  sourceReferences: ISourceReference[]
): Promise<IBrandProfile> {
  const updated = await BrandProfile.findOneAndUpdate(
    { organizationId },
    {
      $set: {
        brandVoice: parsed.brandVoice || undefined,
        targetAudience: parsed.targetCustomers,
        keyMessaging: parsed.marketingMessaging,
        allowedClaims: parsed.allowedClaims,
        forbiddenClaims: parsed.forbiddenClaims,
        sourceReferences,
        generatedAt: new Date(),
      },
      $setOnInsert: { organizationId },
    },
    { upsert: true, new: true }
  );

  return updated as IBrandProfile;
}

export class CompanyIntelligenceService {
  /**
   * Generates (or regenerates) Company Intelligence for one organization.
   * organizationId always comes from this argument - the LLM's response
   * is never read for an organizationId, so it can never redirect a write
   * to a different organization.
   */
  async generateForOrganization(organizationId: string): Promise<GenerateCompanyIntelligenceResult> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidOrganizationIdError("organizationId is missing or invalid");
    }

    const context = await this.loadContext(organizationId);

    if (context.excerpts.length === 0 && !context.onboarding) {
      throw new NoCompanyKnowledgeError(organizationId);
    }

    // May throw CompanyIntelligenceConfigurationError, LlmRequestError, or InvalidLlmResponseError.
    const llmResult = await requestCompanyIntelligenceFromLlm(context);

    return this.persist(organizationId, context, llmResult);
  }

  private async loadContext(organizationId: string): Promise<CompanyIntelligenceContext> {
    try {
      return await gatherCompanyIntelligenceContext(organizationId);
    } catch (error) {
      throw new CompanyIntelligenceDatabaseError(
        `failed to gather company knowledge: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async persist(
    organizationId: string,
    context: CompanyIntelligenceContext,
    llmResult: CompanyIntelligenceLlmResult
  ): Promise<GenerateCompanyIntelligenceResult> {
    try {
      const sourceReferences = buildSourceReferences(context);

      const productIds = await upsertProductsOrServices(Product, organizationId, llmResult.products, sourceReferences);
      const serviceIds = await upsertProductsOrServices(Service, organizationId, llmResult.services, sourceReferences);

      const companyIntelligence = await upsertCompanyIntelligence(
        organizationId,
        llmResult,
        sourceReferences,
        productIds,
        serviceIds
      );
      const brandProfile = await upsertBrandProfile(organizationId, llmResult, sourceReferences);

      return {
        companyIntelligenceId: companyIntelligence._id.toString(),
        brandProfileId: brandProfile._id.toString(),
        productIds: productIds.map((id) => id.toString()),
        serviceIds: serviceIds.map((id) => id.toString()),
        sourcesUsed: context.excerpts.length,
        chunksUsed: context.chunksUsed,
        version: companyIntelligence.version,
      };
    } catch (error) {
      throw new CompanyIntelligenceDatabaseError(
        `failed to save generated company intelligence: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const companyIntelligenceService = new CompanyIntelligenceService();
