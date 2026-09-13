import {
  ContentAudience,
  ContentChannel,
  ContentFormat,
  ContentGoal,
  ContentItemStatus,
  ContentPlanDuration,
  FunnelStage,
  TopicScore,
} from "./content.types";

/**
 * Internal orchestration types for Phase 7 Steps 2-10 - not part of the
 * Step 1 public data contracts (content.types.ts), which stay untouched.
 */

/**
 * Best-effort strategy context, populated only when a real Strategy Agent
 * / MarketingStrategy record exists (see adapters/strategyContextAdapter.ts).
 * null means "not available yet" - never an invented/empty-but-present
 * strategy.
 */
export interface StrategyContext {
  strategyId: string;
  icp?: string;
  personas: ContentAudience[];
  positioning?: string;
  messagingFramework: string[];
  funnelPriorities: FunnelStage[];
  channels: ContentChannel[];
  contentPillars: string[];
  kpis: string[];
}

/**
 * Best-effort research context, populated only when a real Research Agent
 * / ResearchReport record exists (see adapters/researchContextAdapter.ts).
 * null means "not available yet".
 */
export interface ResearchContext {
  marketInsights: string[];
  competitorInsights: string[];
  keywordOpportunities: string[];
  trendInsights: string[];
  audienceInsights: string[];
}

/** Real Company Brain data (Phase 3), reshaped for Content Intelligence's own use. */
export interface CompanyBrainContext {
  companyOverview?: string;
  industry?: string;
  targetCustomers: string[];
  customerProblems: string[];
  differentiators: string[];
  valuePropositions: string[];
  brandVoice?: string;
  marketingMessaging: string[];
  allowedClaims: string[];
  forbiddenClaims: string[];
  products: { name: string; description?: string }[];
  services: { name: string; description?: string }[];
}

/** Lightweight summary of one existing ContentItem, used for gap analysis and diversity checks. */
export interface ExistingContentSummaryItem {
  topic: string;
  contentPillar: string;
  funnelStage: FunnelStage;
  channel: ContentChannel;
  format: ContentFormat;
  personaDescription: string;
  status: ContentItemStatus;
}

/**
 * Everything Content Intelligence needs to make decisions, assembled by
 * ContentContextService (Step 3). strategy/research are null exactly when
 * no upstream agent exists yet - never backfilled with invented content.
 */
export interface ContentIntelligenceContext {
  organizationId: string;
  companyBrain: CompanyBrainContext | null;
  strategy: StrategyContext | null;
  research: ResearchContext | null;
  existingContent: ExistingContentSummaryItem[];
  /** Human-readable notes about what upstream context was unavailable, surfaced to callers rather than hidden. */
  warnings: string[];
}

/** Output of Step 4 (Content Gap Analysis) - purely derived from real counts, never a guessed gap. */
export interface ContentGapAnalysis {
  overusedTopics: string[];
  underservedFunnelStages: FunnelStage[];
  weakContentPillars: string[];
  underservedPersonas: string[];
  recommendedFocus: string[];
}

/** A single topic idea before scoring. */
export interface TopicCandidate {
  topic: string;
  angle: string;
  rationale: string;
  suggestedFunnelStage: FunnelStage;
  suggestedContentPillar: string;
}

export interface ScoredTopicCandidate extends TopicCandidate {
  score: TopicScore;
}

/** Output of Step 6 (Content Decision Engine) for one topic. */
export interface ContentDecision {
  audience: ContentAudience;
  funnelStage: FunnelStage;
  contentPillar: string;
  channel: ContentChannel;
  format: ContentFormat;
  angle: string;
}

export interface ContentValidationResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

export interface GenerateContentPlanInput {
  organizationId: string;
  goal: ContentGoal;
  duration: ContentPlanDuration;
  strategyId?: string;
  campaignId?: string;
  startDate?: Date;
  /** Required when duration is "custom"; ignored otherwise. */
  endDate?: Date;
  /** How many content items to plan per 7-day window. Defaults to 3 (Instagram-first cadence). */
  itemsPerWeek?: number;
}

export interface GenerateContentPlanResult {
  contentPlanId: string;
  itemCount: number;
  startDate: Date;
  endDate: Date;
  /** Upstream-context caveats (e.g. "no strategy available yet"), not errors. */
  warnings: string[];
  /** Per-item validation warnings/drops encountered while building the plan. */
  validationWarnings: string[];
}
