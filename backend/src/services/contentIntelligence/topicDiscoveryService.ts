import { ContentGoal, FunnelStage } from "./content.types";
import { requestTopicCandidates } from "./contentIntelligenceLlm";
import { rankScoredTopics, scoreTopicCandidate } from "./topicScoringService";
import { ContentGapAnalysis, ContentIntelligenceContext, ScoredTopicCandidate } from "./types";

const DEFAULT_TOPIC_COUNT = 10;

/**
 * Step 5: Topic Intelligence (discovery half).
 *
 * Asks the LLM for topic candidates grounded in the gathered context and
 * gap analysis - never "generate 30 content ideas" blind - scores each one
 * deterministically (see topicScoringService), and returns them ranked
 * best-first. Deduplicates near-identical topics so a plan never repeats
 * itself.
 */
export async function discoverTopics(
  context: ContentIntelligenceContext,
  gaps: ContentGapAnalysis,
  goal: ContentGoal,
  count: number = DEFAULT_TOPIC_COUNT,
  funnelStage?: FunnelStage
): Promise<ScoredTopicCandidate[]> {
  const rawCandidates = await requestTopicCandidates(context, gaps, goal, count, funnelStage);

  const seen = new Set<string>();
  const deduped = rawCandidates.filter((candidate) => {
    const key = candidate.topic.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const scored = deduped.map((candidate) => scoreTopicCandidate(candidate, context));
  return rankScoredTopics(scored);
}
