import CompanyIntelligence from "../../models/CompanyIntelligence";
import BrandProfile from "../../models/BrandProfile";
import Product from "../../models/Product";
import Service from "../../models/Service";
import ContentItem from "../../models/ContentItem";
import { strategyContextProvider } from "./adapters/strategyContextAdapter";
import { researchContextProvider } from "./adapters/researchContextAdapter";
import { CompanyBrainContext, ContentIntelligenceContext, ExistingContentSummaryItem } from "./types";

const MAX_EXISTING_CONTENT_ITEMS = 200;

interface CompanyBrainRow {
  companyOverview?: string;
  industry?: string;
  targetCustomers?: string[];
  customerProblems?: string[];
  differentiators?: string[];
  valuePropositions?: string[];
  brandVoice?: string;
  marketingMessaging?: string[];
  allowedClaims?: string[];
  forbiddenClaims?: string[];
}

interface BrandRow {
  brandVoice?: string;
  targetAudience?: string[];
  keyMessaging?: string[];
  allowedClaims?: string[];
  forbiddenClaims?: string[];
}

async function loadCompanyBrain(organizationId: string): Promise<CompanyBrainContext | null> {
  const [intelligenceDoc, brandDoc, productDocs, serviceDocs] = await Promise.all([
    CompanyIntelligence.findOne({ organizationId }).lean(),
    BrandProfile.findOne({ organizationId }).lean(),
    Product.find({ organizationId }).lean(),
    Service.find({ organizationId }).lean(),
  ]);

  if (!intelligenceDoc && !brandDoc && productDocs.length === 0 && serviceDocs.length === 0) {
    return null;
  }

  const intelligence = (intelligenceDoc ?? undefined) as CompanyBrainRow | undefined;
  const brand = (brandDoc ?? undefined) as BrandRow | undefined;

  return {
    companyOverview: intelligence?.companyOverview,
    industry: intelligence?.industry,
    targetCustomers: intelligence?.targetCustomers ?? brand?.targetAudience ?? [],
    customerProblems: intelligence?.customerProblems ?? [],
    differentiators: intelligence?.differentiators ?? [],
    valuePropositions: intelligence?.valuePropositions ?? [],
    brandVoice: intelligence?.brandVoice ?? brand?.brandVoice,
    marketingMessaging: intelligence?.marketingMessaging ?? brand?.keyMessaging ?? [],
    allowedClaims: intelligence?.allowedClaims ?? brand?.allowedClaims ?? [],
    forbiddenClaims: intelligence?.forbiddenClaims ?? brand?.forbiddenClaims ?? [],
    products: productDocs.map((p) => ({ name: p.name, description: p.description })),
    services: serviceDocs.map((s) => ({ name: s.name, description: s.description })),
  };
}

async function loadExistingContent(organizationId: string): Promise<ExistingContentSummaryItem[]> {
  const items = await ContentItem.find({ organizationId })
    .sort({ scheduledDate: -1 })
    .limit(MAX_EXISTING_CONTENT_ITEMS)
    .lean();

  return items.map((item) => ({
    topic: item.topic,
    contentPillar: item.contentPillar,
    funnelStage: item.funnelStage,
    channel: item.channel,
    format: item.format,
    personaDescription: item.persona?.description ?? "",
    status: item.status,
  }));
}

/**
 * Step 3: Content Context Builder.
 *
 * Assembles everything Content Intelligence needs to make decisions: real
 * Company Brain data (Phase 3), best-effort Strategy/Research context via
 * their adapters (null when those agents don't exist yet), and a summary
 * of this organization's existing ContentItems (for gap analysis). Never
 * fabricates strategy or research data - see adapters/.
 */
export async function gatherContentIntelligenceContext(organizationId: string): Promise<ContentIntelligenceContext> {
  const warnings: string[] = [];

  const [companyBrain, strategy, research, existingContent] = await Promise.all([
    loadCompanyBrain(organizationId),
    strategyContextProvider.getActiveStrategy(organizationId),
    researchContextProvider.getResearchContext(organizationId),
    loadExistingContent(organizationId),
  ]);

  if (!strategy) {
    warnings.push("No marketing strategy is available yet - content decisions fall back to Company Brain only.");
  }
  if (!research) {
    warnings.push("No research intelligence is available yet - topic scoring will leave keywordOpportunity/trendRelevance unset.");
  }

  return {
    organizationId,
    companyBrain,
    strategy,
    research,
    existingContent,
    warnings,
  };
}
