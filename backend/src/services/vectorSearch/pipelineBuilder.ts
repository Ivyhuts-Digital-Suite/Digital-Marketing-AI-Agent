import { PipelineStage, Types } from "mongoose";
import { VectorSearchConfig } from "./vectorSearchConfig";

/**
 * Builds the $vectorSearch aggregation pipeline for KnowledgeChunk.
 *
 * organizationId is enforced twice on purpose:
 *  - as a `filter` inside $vectorSearch (requires the Atlas index to have
 *    organizationId configured as a filter field to actually narrow the ANN
 *    search)
 *  - as a plain $match right after, which is always enforced by MongoDB
 *    regardless of how the Atlas index happens to be configured.
 * This means a misconfigured or missing filter field on the Atlas index
 * can never leak another organization's chunks.
 */
export function buildVectorSearchPipeline(
  organizationId: string,
  queryVector: number[],
  config: VectorSearchConfig,
  limit: number
): PipelineStage[] {
  const orgObjectId = new Types.ObjectId(organizationId);

  return [
    {
      $vectorSearch: {
        index: config.indexName,
        path: config.path,
        queryVector,
        numCandidates: config.numCandidates,
        limit,
        filter: { organizationId: orgObjectId },
      },
    },
    {
      // organizationId re-checked unconditionally (see above); embedding
      // existence re-checked too, so a chunk can never surface here on the
      // strength of a stale/partial Atlas index entry alone.
      $match: { organizationId: orgObjectId, embedding: { $exists: true, $ne: null } },
    },
    {
      $project: {
        _id: 1,
        sourceId: 1,
        chunkIndex: 1,
        text: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];
}
