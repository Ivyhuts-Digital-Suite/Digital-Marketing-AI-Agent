import { RawTopicCandidateWithScores } from "./contentIntelligenceValidation";
import { TopicScore } from "./content.types";
import { ContentIntelligenceContext, ScoredTopicCandidate } from "./types";

const WEIGHTS = { relevance: 0.3, strategicAlignment: 0.25, audienceValue: 0.25, novelty: 0.2 };

/** Only produces a score when real keyword research data exists for this org - never a guess. */
function deriveKeywordOpportunity(topic: string, context: ContentIntelligenceContext): number | undefined {
  const keywords = context.research?.keywordOpportunities;
  if (!keywords || keywords.length === 0) return undefined;
  const topicWords = topic.toLowerCase().split(/\s+/);
  const matches = keywords.filter((k) => topicWords.some((w) => w.length > 0 && k.toLowerCase().includes(w)));
  return Math.round((matches.length / keywords.length) * 100);
}

/** Only produces a score when real trend research data exists for this org - never a guess. */
function deriveTrendRelevance(topic: string, context: ContentIntelligenceContext): number | undefined {
  const trends = context.research?.trendInsights;
  if (!trends || trends.length === 0) return undefined;
  const topicWords = topic.toLowerCase().split(/\s+/);
  const matches = trends.filter((t) => topicWords.some((w) => w.length > 0 && t.toLowerCase().includes(w)));
  return Math.round((matches.length / trends.length) * 100);
}

/**
 * Step 5 (scoring half): turns the LLM's raw per-topic judgment scores
 * into a TopicScore, computing totalScore deterministically here (never
 * trusted from the LLM) so ranking stays auditable and reproducible.
 * keywordOpportunity/trendRelevance are only ever set from real research
 * data - since ResearchContextProvider currently always returns null,
 * they are left undefined rather than guessed, exactly reflecting "no
 * research available yet" per TopicScore's own optionality.
 */
export function scoreTopicCandidate(
  candidate: RawTopicCandidateWithScores,
  context: ContentIntelligenceContext
): ScoredTopicCandidate {
  const { relevance, strategicAlignment, audienceValue, novelty } = candidate;

  const totalScore =
    relevance * WEIGHTS.relevance +
    strategicAlignment * WEIGHTS.strategicAlignment +
    audienceValue * WEIGHTS.audienceValue +
    novelty * WEIGHTS.novelty;

  const keywordOpportunity = deriveKeywordOpportunity(candidate.topic, context);
  const trendRelevance = deriveTrendRelevance(candidate.topic, context);

  const score: TopicScore = {
    relevance,
    strategicAlignment,
    audienceValue,
    novelty,
    totalScore: Math.round(totalScore * 100) / 100,
    ...(keywordOpportunity !== undefined ? { keywordOpportunity } : {}),
    ...(trendRelevance !== undefined ? { trendRelevance } : {}),
  };

  return {
    topic: candidate.topic,
    angle: candidate.angle,
    rationale: candidate.rationale,
    suggestedFunnelStage: candidate.suggestedFunnelStage,
    suggestedContentPillar: candidate.suggestedContentPillar,
    score,
  };
}

export function rankScoredTopics(candidates: ScoredTopicCandidate[]): ScoredTopicCandidate[] {
  return [...candidates].sort((a, b) => b.score.totalScore - a.score.totalScore);
}
