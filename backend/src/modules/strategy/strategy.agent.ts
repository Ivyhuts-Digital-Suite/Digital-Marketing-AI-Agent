import { v4 as uuidv4 } from 'uuid';
import {
  StrategyBrief,
  MarketingStrategyPayload,
  StrategyChangeRecord,
} from './strategy.types';
import { StrategyModel, StrategyVersionModel } from './strategy.schema';
import { StrategyContextService } from './strategy.context.service';
import { StrategyAnalysisService } from './strategy.analysis.service';
import { StrategyDecisionService } from './strategy.decision.service';
import { StrategyGenerationService } from './strategy.generation.service';

export class StrategyAgent {
  private contextService: StrategyContextService;
  private analysisService: StrategyAnalysisService;
  private decisionService: StrategyDecisionService;
  private generationService: StrategyGenerationService;

  constructor() {
    this.contextService = new StrategyContextService();
    this.analysisService = new StrategyAnalysisService();
    this.decisionService = new StrategyDecisionService();
    this.generationService = new StrategyGenerationService();
  }

  public async execute(
    brief: StrategyBrief,
    existingStrategyId?: string
  ): Promise<MarketingStrategyPayload> {
    const idToUse = existingStrategyId || brief.strategyId;

    let targetStrategyId = idToUse || `strat_${uuidv4().substring(0, 8)}`;
    let currentVersion = 1;
    let previousStrategy: MarketingStrategyPayload | null = null;

    if (idToUse) {
      const existingDoc = await StrategyModel.findOne({ strategyId: idToUse }).lean();
      if (existingDoc) {
        currentVersion = (existingDoc.version || 1) + 1;
        previousStrategy = existingDoc as unknown as MarketingStrategyPayload;
        targetStrategyId = idToUse;
      }
    }

    const enrichedContext = await this.contextService.buildContext(brief);
    const strategicAnalysis = this.analysisService.analyze(enrichedContext);
    const strategicDecisions = this.decisionService.generateDecisions(
      enrichedContext,
      strategicAnalysis
    );

    const strategyPayload = this.generationService.generate(
      enrichedContext,
      strategicAnalysis,
      strategicDecisions,
      targetStrategyId,
      currentVersion
    );

    await StrategyModel.findOneAndUpdate(
      { strategyId: targetStrategyId },
      strategyPayload,
      { upsert: true, new: true }
    );

    const changes: StrategyChangeRecord[] = [];
    if (previousStrategy) {
      changes.push({
        category: 'Strategy Iteration',
        previousValue: `Version ${previousStrategy.version}`,
        newValue: `Version ${currentVersion}`,
        reason: 'Updated strategy to reflect new target constraints and updated market intelligence.',
        evidenceIds: strategicDecisions.map((d) => d.evidence.claim || '').filter(Boolean),
      });
    }

    await StrategyVersionModel.create({
      strategyId: targetStrategyId,
      version: currentVersion,
      organizationId: brief.organizationId,
      snapshot: strategyPayload,
      changes,
    });

    return strategyPayload;
  }
}