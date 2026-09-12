import { Types } from "mongoose";
import KnowledgeChunk from "../../models/KnowledgeChunk";
import { embeddingService } from "../embedding/embeddingService";
import { InvalidVectorSearchInputError, VectorSearchConfigurationError, VectorSearchExecutionError } from "./errors";
import { getVectorSearchConfig } from "./vectorSearchConfig";
import { buildVectorSearchPipeline } from "./pipelineBuilder";

const DEFAULT_LIMIT = 5;

export interface VectorSearchOptions {
  /** Number of chunks to return. Defaults to 5. */
  limit?: number;
  /** Overrides the numCandidates read from VECTOR_NUM_CANDIDATES for this query. */
  numCandidates?: number;
}

export interface VectorSearchResultItem {
  chunkId: string;
  sourceId: string;
  chunkIndex: number;
  text: string;
  metadata?: Record<string, unknown>;
  score: number;
}

interface VectorSearchAggregationRow {
  _id: Types.ObjectId;
  sourceId: Types.ObjectId;
  chunkIndex: number;
  text: string;
  metadata?: Record<string, unknown>;
  score: number;
}

/**
 * Step 5: Vector Search.
 *
 * query text -> EmbeddingService.generateEmbedding -> MongoDB Atlas
 * $vectorSearch over KnowledgeChunk.embedding -> ranked chunks, always
 * scoped to a single organizationId.
 *
 * Does not generate embeddings itself (delegates to the existing
 * EmbeddingService), does not create/manage the Atlas Search index, and
 * does not touch document processing, chunking, or auth.
 */
export class VectorSearchService {
  /**
   * Strips anything that looks like a MongoDB connection string or an
   * OpenAI-style secret key before a driver/Atlas error can surface it to a
   * caller. Aggregation errors are not expected to contain either, but this
   * is defense in depth, mirroring EmbeddingService's own sanitization.
   */
  private sanitizeErrorMessage(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error);
    return raw
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, "[redacted-connection-string]")
      .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
  }

  private assertValidOrganizationId(organizationId: string): void {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidVectorSearchInputError("organizationId is missing or invalid");
    }
  }

  private assertValidQueryText(queryText: string): void {
    if (typeof queryText !== "string" || queryText.trim().length === 0) {
      throw new InvalidVectorSearchInputError("queryText must be a non-empty, non-whitespace string");
    }
  }

  private assertValidLimit(limit: number): void {
    if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit <= 0) {
      throw new InvalidVectorSearchInputError("limit must be a positive integer");
    }
  }

  /**
   * Generates the query embedding via the existing EmbeddingService and
   * sanity-checks its length against VECTOR_DIMENSIONS when that is
   * configured. Never fabricates a vector: if OPENAI_API_KEY is missing,
   * the EmbeddingService's own EmbeddingConfigurationError propagates
   * unchanged (a controlled, typed error - never a crash, never a fake
   * embedding).
   */
  private async embedQuery(queryText: string, dimensions?: number): Promise<number[]> {
    const queryVector = await embeddingService.generateEmbedding(queryText);

    if (dimensions !== undefined && queryVector.length !== dimensions) {
      throw new VectorSearchConfigurationError(
        `configured VECTOR_DIMENSIONS is ${dimensions} but the embedding model returned a vector of length ${queryVector.length}`
      );
    }

    return queryVector;
  }

  /**
   * Searches KnowledgeChunks for a single organization by semantic
   * similarity to queryText. organizationId is mandatory and is enforced
   * both inside the $vectorSearch filter and via an unconditional $match
   * afterwards, so no other organization's chunks can ever be returned.
   */
  async searchKnowledgeChunks(
    organizationId: string,
    queryText: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResultItem[]> {
    this.assertValidOrganizationId(organizationId);
    this.assertValidQueryText(queryText);

    const limit = options.limit ?? DEFAULT_LIMIT;
    this.assertValidLimit(limit);

    const config = getVectorSearchConfig();
    const numCandidates = options.numCandidates ?? config.numCandidates;

    if (!Number.isFinite(numCandidates) || !Number.isInteger(numCandidates) || numCandidates <= 0) {
      throw new InvalidVectorSearchInputError("numCandidates must be a positive integer");
    }

    const queryVector = await this.embedQuery(queryText, config.dimensions);

    const pipeline = buildVectorSearchPipeline(organizationId, queryVector, { ...config, numCandidates }, limit);

    let rows: VectorSearchAggregationRow[];
    try {
      rows = await KnowledgeChunk.aggregate<VectorSearchAggregationRow>(pipeline);
    } catch (error) {
      throw new VectorSearchExecutionError(this.sanitizeErrorMessage(error));
    }

    return rows.map((row) => ({
      chunkId: row._id.toString(),
      sourceId: row.sourceId.toString(),
      chunkIndex: row.chunkIndex,
      text: row.text,
      metadata: row.metadata,
      score: row.score,
    }));
  }
}

export const vectorSearchService = new VectorSearchService();
