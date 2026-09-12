import { FunnelStage } from "./content.types";
import { ContentGapAnalysis, ContentIntelligenceContext } from "./types";

const ALL_FUNNEL_STAGES: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];
/** Same topic planned this many times or more is treated as overused. */
const OVERUSE_THRESHOLD = 3;

function countBy<T>(items: T[], keyFn: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item).trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Step 4: Content Gap Analysis.
 *
 * Pure function over already-gathered context - no LLM call, no DB access.
 * Every gap is a real count comparison over existingContent (and, when
 * available, strategy.contentPillars/funnelPriorities/personas); nothing
 * here is guessed or invented.
 */
export function analyzeContentGaps(context: ContentIntelligenceContext): ContentGapAnalysis {
  const { existingContent, strategy } = context;

  const topicCounts = countBy(existingContent, (item) => item.topic);
  const overusedTopics = [...topicCounts.entries()]
    .filter(([, count]) => count >= OVERUSE_THRESHOLD)
    .map(([topic]) => topic);

  const funnelCounts = countBy(existingContent, (item) => item.funnelStage);
  const funnelStagesToConsider =
    strategy && strategy.funnelPriorities.length > 0 ? strategy.funnelPriorities : ALL_FUNNEL_STAGES;
  const underservedFunnelStages = funnelStagesToConsider.filter((stage) => (funnelCounts.get(stage) ?? 0) === 0);

  const pillarCounts = countBy(existingContent, (item) => item.contentPillar);
  const pillarsToConsider =
    strategy && strategy.contentPillars.length > 0 ? strategy.contentPillars : [...pillarCounts.keys()];
  const averagePillarCount =
    pillarsToConsider.length > 0
      ? [...pillarCounts.values()].reduce((sum, n) => sum + n, 0) / pillarsToConsider.length
      : 0;
  const weakContentPillars = pillarsToConsider.filter(
    (pillar) => (pillarCounts.get(pillar.toLowerCase()) ?? 0) < averagePillarCount
  );

  const personaCounts = countBy(existingContent, (item) => item.personaDescription);
  const personasToConsider =
    strategy && strategy.personas.length > 0 ? strategy.personas.map((p) => p.description) : [...personaCounts.keys()];
  const underservedPersonas = personasToConsider.filter((persona) => (personaCounts.get(persona.toLowerCase()) ?? 0) === 0);

  const recommendedFocus: string[] = [];
  if (underservedFunnelStages.length > 0) {
    recommendedFocus.push(`Funnel stages with no planned content: ${underservedFunnelStages.join(", ")}`);
  }
  if (weakContentPillars.length > 0) {
    recommendedFocus.push(`Content pillars below average coverage: ${weakContentPillars.join(", ")}`);
  }
  if (underservedPersonas.length > 0) {
    recommendedFocus.push(`Personas with no planned content: ${underservedPersonas.join(", ")}`);
  }
  if (overusedTopics.length > 0) {
    recommendedFocus.push(`Avoid repeating these overused topics: ${overusedTopics.join(", ")}`);
  }

  return { overusedTopics, underservedFunnelStages, weakContentPillars, underservedPersonas, recommendedFocus };
}
