export type ClaimType =
  | "statistic"
  | "quote"
  | "fact"
  | "opinion"
  | "trend"
  | "general";

export interface ResearchClaim {
  id?: string;
  reportId?: string;
  sourceId?: string;
  sourceUrl?: string;
  claim: string;
  claimType?: ClaimType;
  type?: ClaimType;
  category?: string;
  evidence?: string;
  confidence: number;
  extractedAt?: Date;
}

export interface ResearchQuery {
  companyName: string;
  industry?: string;
  competitors?: string[];
  focusAreas?: string[];
}

export interface ResearchPlan {
  steps: string[];
  targetDomains: string[];
  searchQueries: string[];
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  isValidated: boolean;
  credibilityScore: number;
}

export type ExtractedClaim = ResearchClaim;

export interface ResearchSynthesisResult {
  summary: string;
  insights: string[];
  competitorAnalysis?: Record<string, unknown>;
  marketTrends?: string[];
}

export interface ResearchAgentOutput {
  query: ResearchQuery;
  plan: ResearchPlan;
  sources: ResearchSource[];
  claims: ResearchClaim[];
  synthesis: ResearchSynthesisResult;
  status: "pending" | "in-progress" | "completed" | "failed";
}
