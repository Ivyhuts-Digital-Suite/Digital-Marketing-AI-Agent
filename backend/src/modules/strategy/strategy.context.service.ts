import { StrategyBrief } from './strategy.types';
import { ResearchModel } from '../research/database/research.schema';

export interface EnrichedStrategyContext {
  organizationId: string;
  brief: StrategyBrief;
  companyContext: {
    name: string;
    profile: string;
    allowedClaims: string[];
    brandGuidelines?: string;
  };
  researchContext: {
    marketSummary: string[];
    competitorGaps: string[];
    trendingKeywords: string[];
    verifiedClaims: Array<{ claim: string; source: string; confidence: number }>;
  };
}

export class StrategyContextService {
  async buildContext(brief: StrategyBrief): Promise<EnrichedStrategyContext> {
    const researchDocs: any[] = await ResearchModel.find({ organizationId: brief.organizationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const verifiedClaims: Array<{ claim: string; source: string; confidence: number }> = [];
    const marketSummary: string[] = [];
    const competitorGaps: string[] = [];
    const trendingKeywords: string[] = [];

    for (const doc of researchDocs) {
      if (doc.summary) {
        marketSummary.push(typeof doc.summary === 'string' ? doc.summary : JSON.stringify(doc.summary));
      }
      if (Array.isArray(doc.claims)) {
        for (const c of doc.claims) {
          verifiedClaims.push({
            claim: c.claim || '',
            source: c.sourceUrl || c.source || '',
            confidence: c.confidence ?? c.confidenceScore ?? 0.8,
          });
        }
      }
      if (Array.isArray(doc.keywords)) {
        trendingKeywords.push(...doc.keywords);
      }
      if (Array.isArray(doc.competitors)) {
        competitorGaps.push(...doc.competitors.map((item: any) => typeof item === 'string' ? item : item.name || ''));
      }
    }

    return {
      organizationId: brief.organizationId,
      brief,
      companyContext: {
        name: 'Company Profile',
        profile: brief.existingProblems?.join(', ') || 'B2B Enterprise SaaS',
        allowedClaims: verifiedClaims.map((c) => c.claim),
        brandGuidelines: 'Professional, authoritative, data-driven',
      },
      researchContext: {
        marketSummary: marketSummary.length ? marketSummary : ['Market shows growth opportunities'],
        competitorGaps: competitorGaps.length ? competitorGaps : ['Underserved SMB segment'],
        trendingKeywords: trendingKeywords.length ? trendingKeywords : ['marketing automation'],
        verifiedClaims,
      },
    };
  }
}