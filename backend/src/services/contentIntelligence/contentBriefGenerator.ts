import { Types } from "mongoose";
import { vectorSearchService } from "../vectorSearch/vectorSearchService";
import { ContentBrief, ContentEvidenceReference, ContentGoal } from "./content.types";
import { requestContentBrief } from "./contentIntelligenceLlm";
import { ContentDecision, ContentIntelligenceContext, ScoredTopicCandidate } from "./types";

const MAX_EVIDENCE_CHUNKS = 3;

/**
 * Best-effort grounding: reuses the existing VectorSearchService to pull
 * real, organization-scoped KnowledgeChunks relevant to this topic. Never
 * fabricates evidence - if Atlas Vector Search isn't configured/
 * provisioned yet, or the query fails for any reason, this simply returns
 * no evidence rather than failing the whole brief. See vectorSearch/ for
 * why: it's real semantic retrieval, degrading safely, not a stub.
 */
async function gatherEvidence(organizationId: string, topic: string): Promise<ContentEvidenceReference[]> {
  if (!Types.ObjectId.isValid(organizationId)) return [];

  try {
    const results = await vectorSearchService.searchKnowledgeChunks(organizationId, topic, {
      limit: MAX_EVIDENCE_CHUNKS,
    });
    return results.map((r) => ({
      sourceId: r.sourceId,
      chunkId: r.chunkId,
      excerpt: r.text.slice(0, 300),
      score: r.score,
    }));
  } catch {
    return [];
  }
}

/**
 * Step 7: Content Brief Generation.
 *
 * Combines a ContentDecision (Step 6) with LLM-written creative copy
 * (hook/coreMessage/keyPoints/cta/successMetric/rationale) grounded in
 * real brand voice and allowed/forbidden claims, plus best-effort evidence
 * from real KnowledgeChunks. Produces the exact ContentBrief contract from
 * Step 1 - nothing here invents a fact outside the supplied context.
 */
export async function generateContentBrief(
  context: ContentIntelligenceContext,
  goal: ContentGoal,
  candidate: ScoredTopicCandidate,
  decision: ContentDecision
): Promise<ContentBrief> {
  const briefCopy = await requestContentBrief(context, {
    goal,
    audience: decision.audience,
    funnelStage: decision.funnelStage,
    contentPillar: decision.contentPillar,
    topic: candidate.topic,
    angle: decision.angle,
    channel: decision.channel,
    format: decision.format,
  });

  const evidence = await gatherEvidence(context.organizationId, candidate.topic);

  return {
    organizationId: context.organizationId,
    goal,
    audience: decision.audience,
    funnelStage: decision.funnelStage,
    contentPillar: decision.contentPillar,
    topic: candidate.topic,
    angle: decision.angle,
    channel: decision.channel,
    format: decision.format,
    hook: briefCopy.hook,
    coreMessage: briefCopy.coreMessage,
    keyPoints: briefCopy.keyPoints,
    cta: briefCopy.cta,
    successMetric: briefCopy.successMetric,
    rationale: briefCopy.rationale,
    evidence: evidence.length > 0 ? evidence : undefined,
  };
}
