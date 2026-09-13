import { ISourceReference } from "../../models/common/sourceReference";

/** One excerpt of usable company text, already bounded/truncated, ready to go into the LLM prompt. */
export interface ContextExcerpt {
  sourceType: "document" | "url";
  sourceId: string;
  label: string;
  url?: string;
  pageType?: string;
  text: string;
  chunkIds: string[];
}

export interface CompanyIntelligenceContext {
  organizationId: string;
  /** Best-effort onboarding data, only populated if an "Organization" model happens to be registered. Never fabricated. */
  onboarding: Record<string, unknown> | null;
  excerpts: ContextExcerpt[];
  totalCharacters: number;
  chunksUsed: number;
}

/** A single product or service as extracted by the LLM, before it becomes a Product/Service document. */
export interface LlmProductOrService {
  name: string;
  description: string;
  targetAudience?: string;
  problemsSolved: string[];
  benefits: string[];
  differentiators: string[];
}

/**
 * The exact structured shape we ask the LLM for and validate its response
 * against. Every array defaults to [] and every optional string defaults
 * to undefined - "unknown" is always representable without inventing
 * anything.
 */
export interface CompanyIntelligenceLlmResult {
  companyOverview: string;
  industry: string;
  targetCustomers: string[];
  customerProblems: string[];
  products: LlmProductOrService[];
  services: LlmProductOrService[];
  differentiators: string[];
  competitors: string[];
  valuePropositions: string[];
  brandVoice: string;
  marketingMessaging: string[];
  allowedClaims: string[];
  forbiddenClaims: string[];
  importantFacts: string[];
}

export interface GenerateCompanyIntelligenceResult {
  companyIntelligenceId: string;
  brandProfileId: string;
  productIds: string[];
  serviceIds: string[];
  sourcesUsed: number;
  chunksUsed: number;
  version: number;
}

export type { ISourceReference };
