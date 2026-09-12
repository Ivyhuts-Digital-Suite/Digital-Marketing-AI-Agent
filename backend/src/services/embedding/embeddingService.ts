import OpenAI from "openai";
import { Types } from "mongoose";
import KnowledgeChunk from "../../models/KnowledgeChunk";
import KnowledgeSource from "../../models/KnowledgeSource";
import {
  EmbeddingConfigurationError,
  EmbeddingGenerationError,
  EmptySourceError,
  InvalidEmbeddingInputError,
} from "./errors";

const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

// OpenAI accepts many inputs per request; batching keeps this comfortably
// under both the array-length and token limits of the embeddings endpoint.
const EMBEDDING_BATCH_SIZE = 100;

export interface EmbedChunksForSourceResult {
  sourceId: string;
  chunkCount: number;
}

/**
 * Step 4: Embedding Service.
 *
 * KnowledgeChunk.text -> Embedding API -> number[] vector ->
 * KnowledgeChunk.embedding -> KnowledgeSource.status = "embedded".
 *
 * Does not touch vector search indexes, company/website intelligence, or
 * the marketing brain. Those are later steps.
 */
export class EmbeddingService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim().length === 0) {
      throw new EmbeddingConfigurationError("OPENAI_API_KEY is not set in the environment");
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  private getModel(): string {
    const model = process.env.EMBEDDING_MODEL;
    return model && model.trim().length > 0 ? model.trim() : DEFAULT_EMBEDDING_MODEL;
  }

  /** Strips anything that looks like an API key before an error can surface it. */
  private sanitizeErrorMessage(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error);
    return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
  }

  private assertNonEmptyText(text: string): void {
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new InvalidEmbeddingInputError("text must be a non-empty, non-whitespace string");
    }
  }

  private assertValidEmbedding(embedding: unknown): embedding is number[] {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return false;
    }
    return embedding.every((value) => typeof value === "number" && Number.isFinite(value));
  }

  /**
   * Generates a single embedding vector for a piece of text.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    this.assertNonEmptyText(text);

    const [embedding] = await this.generateEmbeddings([text]);
    return embedding;
  }

  /**
   * Generates embedding vectors for multiple texts, batching requests to
   * the embeddings API instead of issuing one call per text.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new InvalidEmbeddingInputError("texts must be a non-empty array");
    }

    texts.forEach((text) => this.assertNonEmptyText(text));

    const client = this.getClient();
    const model = this.getModel();
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

      let response;
      try {
        response = await client.embeddings.create({
          model,
          input: batch,
        });
      } catch (error) {
        throw new EmbeddingGenerationError(this.sanitizeErrorMessage(error));
      }

      const sorted = [...response.data].sort((a, b) => a.index - b.index);

      for (const item of sorted) {
        if (!this.assertValidEmbedding(item.embedding)) {
          throw new EmbeddingGenerationError(
            "embedding API returned an invalid embedding (expected a non-empty array of numbers)"
          );
        }
        results.push(item.embedding as number[]);
      }
    }

    return results;
  }

  /**
   * Embeds every KnowledgeChunk belonging to a single organization + source,
   * persists the resulting vectors, and moves the KnowledgeSource to
   * "embedded" only once every chunk has a valid embedding.
   *
   * Never reads or modifies chunks belonging to any other source or
   * organization.
   */
  async embedChunksForSource(
    organizationId: string,
    sourceId: string
  ): Promise<EmbedChunksForSourceResult> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidEmbeddingInputError("organizationId is missing or invalid");
    }

    if (!sourceId || !Types.ObjectId.isValid(sourceId)) {
      throw new InvalidEmbeddingInputError("sourceId is missing or invalid");
    }

    try {
      const chunks = await KnowledgeChunk.find({ organizationId, sourceId }).sort({
        chunkIndex: 1,
      });

      if (chunks.length === 0) {
        throw new EmptySourceError(sourceId);
      }

      const texts = chunks.map((chunk) => chunk.text);
      const embeddings = await this.generateEmbeddings(texts);

      if (embeddings.length !== chunks.length) {
        throw new EmbeddingGenerationError(
          `expected ${chunks.length} embeddings but received ${embeddings.length}`
        );
      }

      for (const embedding of embeddings) {
        if (!this.assertValidEmbedding(embedding)) {
          throw new EmbeddingGenerationError(
            "generated embedding is invalid (expected a non-empty array of numbers)"
          );
        }
      }

      await Promise.all(
        chunks.map((chunk, index) =>
          KnowledgeChunk.updateOne(
            { _id: chunk._id, organizationId, sourceId },
            { $set: { embedding: embeddings[index] } }
          )
        )
      );

      await KnowledgeSource.updateOne(
        { _id: sourceId, organizationId },
        { $set: { status: "embedded" }, $unset: { processingError: "" } }
      );

      return { sourceId, chunkCount: chunks.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await KnowledgeSource.updateOne(
        { _id: sourceId, organizationId },
        { $set: { status: "failed", processingError: message } }
      );

      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();
