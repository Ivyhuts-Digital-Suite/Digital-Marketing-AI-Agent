import { EnrichedStrategyContext } from './strategy.context.service';
import { StrategicAnalysisResult } from './strategy.analysis.service';
import { StrategyDecision } from './strategy.types';

export class StrategyDecisionService {
  public generateDecisions(
    context: EnrichedStrategyContext,
    analysis: StrategicAnalysisResult
  ): StrategyDecision[] {
    const decisions: StrategyDecision[] = [];

    // Decision 1: Primary Channels (Instagram + LinkedIn)
    decisions.push({
      category: 'Channel Strategy',
      decision: 'Prioritize LinkedIn for executive outreach and Instagram for high-impact visual proof.',
      rationale: 'LinkedIn targets decision makers with organic industry education, while Instagram captures visual product workflows.',
      evidence: {
        sourceType: 'research',
        claim: context.researchContext.verifiedClaims[0]?.claim || 'High B2B engagement noted on professional networks.',
      },
      confidence: 0.9,
    });

    // Decision 2: Positioning Differentiation
    decisions.push({
      category: 'Positioning',
      decision: 'Position as the only Auditable, Evidence-Driven Marketing Platform.',
      rationale: 'Directly tackles the competitor gap where black-box AI generates unsubstantiated claims.',
      evidence: {
        sourceType: 'company',
        claim: context.companyContext.allowedClaims[0] || 'Automates data-driven marketing workflows',
      },
      confidence: 0.95,
    });

    // Decision 3: Funnel Structure
    decisions.push({
      category: 'Funnel Strategy',
      decision: 'Deploy full-funnel approach emphasizing customer proofs at Consideration stage.',
      rationale: 'B2B enterprise buyers require proof points and case studies before scheduling product demos.',
      evidence: {
        sourceType: 'business_goal',
        claim: `Aligns with business objective: ${context.brief.goals[0]?.description || 'Pipeline growth'}`,
      },
      confidence: 0.88,
    });

    return decisions;
  }
}