export type StrategyGoalType =
  | 'brand_awareness'
  | 'lead_generation'
  | 'pipeline_growth'
  | 'customer_acquisition'
  | 'product_launch'
  | 'market_expansion';

export interface BusinessGoalItem {
  type: StrategyGoalType;
  description: string;
  targetValue?: number;
  timeframe?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface StrategyBrief {
  organizationId: string;
  strategyId?: string;
  goals: BusinessGoalItem[];
  targetMarket?: {
    countries?: string[];
    industries?: string[];
  };
  budget?: {
    amount?: number;
    currency?: string;
    period?: string;
  };
  constraints?: string[];
  preferredChannels?: string[];
  existingProblems?: string[];
}

export interface IdealCustomerProfile {
  companySize: string;
  industry: string[];
  geography: string[];
  revenueRange?: string;
  technologyMaturity?: string;
  painPoints: string[];
  buyingTriggers: string[];
  decisionMakers: string[];
}

export interface BuyerPersona {
  name: string;
  type: 'Decision Maker' | 'Influencer' | 'End User';
  role: string;
  responsibilities: string[];
  goals: string[];
  painPoints: string[];
  objections: string[];
  buyingMotivation: string[];
  preferredContent: string[];
}

export interface PositioningStrategy {
  positioningStatement: string;
  targetAudience: string;
  problemSolved: string;
  valueProposition: string;
  differentiators: string[];
  competitivePosition: string;
}

export interface MessagingFramework {
  coreMessage: string;
  valueProposition: string;
  painBasedMessages: string[];
  benefitMessages: string[];
  proofMessages: string[];
  personaSpecificMessages: {
    personaType: string;
    message: string;
  }[];
}

export interface FunnelStageStrategy {
  stage: 'AWARENESS' | 'CONSIDERATION' | 'CONVERSION' | 'RETENTION';
  goal: string;
  audience: string;
  message: string;
  content: string[];
  channels: string[];
  cta: string;
  kpis: string[];
}

export interface ChannelRecommendation {
  channel: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  targetStage: string[];
  contentFormats: string[];
}

export interface ContentPillar {
  pillarName: string;
  description: string;
  subTopics: string[];
  intendedChannels: string[];
  targetPersonas: string[];
}

export interface CampaignPlan {
  name: string;
  objective: StrategyGoalType;
  audience: string;
  coreMessage: string;
  offer: string;
  channels: string[];
  contentDeliverables: string[];
  timeline: string;
  kpis: string[];
}

export interface KpiTarget {
  category: 'Awareness' | 'Engagement' | 'Acquisition' | 'Retention';
  metric: string;
  targetValue: string;
  timeframe: string;
}

export interface BudgetRecommendation {
  totalEstimatedBudget: number;
  currency: string;
  isEstimated: boolean;
  allocations: {
    paidAdvertising: number;
    contentProduction: number;
    influencerPartnerships: number;
    toolsAndSoftware: number;
    experiments: number;
  };
}

export interface StrategyDecision {
  category: string;
  decision: string;
  rationale: string;
  evidence: {
    sourceType: 'company' | 'research' | 'business_goal';
    referenceId?: string;
    claim?: string;
  };
  confidence: number;
}

export interface StrategyChangeRecord {
  category: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  evidenceIds: string[];
}

export interface MarketingStrategyPayload {
  organizationId: string;
  strategyId: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  icp: IdealCustomerProfile;
  buyerPersonas: BuyerPersona[];
  positioning: PositioningStrategy;
  messagingFramework: MessagingFramework;
  funnel: FunnelStageStrategy[];
  channelStrategy: ChannelRecommendation[];
  contentPillars: ContentPillar[];
  campaignStrategy: CampaignPlan[];
  kpis: KpiTarget[];
  budgetRecommendations: BudgetRecommendation;
  decisions: StrategyDecision[];
}