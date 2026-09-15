/**
 * Seam between validated analytics/optimization insights and the Strategy
 * Agent (Phase 6, does not exist in this codebase yet - see the same
 * situation documented in contentIntelligence/adapters/). Recording an
 * insight here never mutates a Strategy document directly (rule: "do not
 * automatically mutate the Strategy model") - it is a one-way notification
 * a real Strategy Agent would read, act on, and version itself.
 */
export interface ValidatedPerformanceInsight {
  organizationId: string;
  summary: string;
  relatedFindingId?: string;
  relatedContentItemId?: string;
  metric: string;
  changePercent?: number;
}

export interface StrategyFeedbackAdapter {
  recordInsight(insight: ValidatedPerformanceInsight): Promise<void>;
}

export class NullStrategyFeedbackAdapter implements StrategyFeedbackAdapter {
  async recordInsight(insight: ValidatedPerformanceInsight): Promise<void> {
    console.log(
      `[strategyFeedbackAdapter] No Strategy Agent exists yet - insight not delivered: ${insight.summary}`
    );
  }
}

export const strategyFeedbackAdapter: StrategyFeedbackAdapter = new NullStrategyFeedbackAdapter();
