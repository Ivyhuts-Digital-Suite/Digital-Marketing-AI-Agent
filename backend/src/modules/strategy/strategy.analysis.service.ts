import { EnrichedStrategyContext } from './strategy.context.service';

export interface StrategicAnalysisResult {
  identifiedOpportunities: string[];
  positioningGaps: string[];
  audienceInsights: string[];
  strategicRisks: string[];
}

export class StrategyAnalysisService {
  public analyze(context: EnrichedStrategyContext): StrategicAnalysisResult {
    const opportunities: string[] = [];
    const gaps: string[] = [];
    const audienceInsights: string[] = [];
    const risks: string[] = [];

    // 1. Opportunity Analysis
    if (context.brief.goals.some((g) => g.type === 'lead_generation' || g.type === 'pipeline_growth')) {
      opportunities.push('High ROI on targeting mid-market B2B decision makers via high-intent search and LinkedIn authority positioning.');
    }
    opportunities.push('Leverage evidence-based claims to differentiate from black-box AI marketing platforms.');

    // 2. Competitor & Positioning Gaps
    if (context.researchContext.competitorGaps.length > 0) {
      gaps.push(...context.researchContext.competitorGaps);
    } else {
      gaps.push('Competitors focus on prompt-based generation without factual research verification.');
    }

    // 3. Audience Analysis
    const targetIndustries = context.brief.targetMarket?.industries?.length
      ? context.brief.targetMarket.industries.join(', ')
      : 'SaaS and High-Growth B2B';
    audienceInsights.push(`Target buyers in ${targetIndustries} demand quantifiable ROI, SOC2/security compliance, and proof metrics before buy-in.`);

    // 4. Strategic Risks
    if (!context.brief.budget || (context.brief.budget.amount && context.brief.budget.amount < 3000)) {
      risks.push('Low initial advertising budget may limit quick top-of-funnel reach; prioritising organic SEO and founder LinkedIn presence is required.');
    }
    risks.push('Strict brand guideline adherence needed to avoid generic AI-sounding messaging.');

    return {
      identifiedOpportunities: opportunities,
      positioningGaps: gaps,
      audienceInsights,
      strategicRisks: risks,
    };
  }
}
