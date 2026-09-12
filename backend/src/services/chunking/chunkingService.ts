import { Types } from "mongoose";
import KnowledgeChunk from "../../models/KnowledgeChunk";
import KnowledgeSource from "../../models/KnowledgeSource";
import { ProcessedDocumentResult } from "../document/documentProcessor";
import { ChunkDraft, ChunkingOptions, splitIntoChunks } from "./textSplitter";
import { ChunkingFailedError, InvalidChunkingInputError } from "./errors";

export interface ChunkSourceInput {
  organizationId: string;
  sourceId: string;
  processedDocument: ProcessedDocumentResult;
  options?: ChunkingOptions;
}

export interface ChunkSourceResult {
  sourceId: string;
  chunkCount: number;
  chunks: ChunkDraft[];
}

/**
 * Step 3: Chunking Engine.
 *
 * Takes the ProcessedDocumentResult produced by Step 2's DocumentProcessor
 * and turns it into persisted KnowledgeChunk records. Does not call an LLM,
 * does not generate embeddings, and does not touch KnowledgeSource beyond
 * moving its status between "chunked" and "failed".
 */
export class ChunkingService {
  async chunkAndPersist(input: ChunkSourceInput): Promise<ChunkSourceResult> {
    const { organizationId, sourceId, processedDocument } = input;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidChunkingInputError("organizationId is missing or invalid");
    }

    if (!sourceId || !Types.ObjectId.isValid(sourceId)) {
      throw new InvalidChunkingInputError("sourceId is missing or invalid");
    }

    try {
      if (
        !processedDocument ||
        !processedDocument.text ||
        processedDocument.text.trim().length === 0
      ) {
        throw new InvalidChunkingInputError("processed document text is empty");
      }

      const drafts = splitIntoChunks(
        {
          text: processedDocument.text,
          pages: processedDocument.pages,
          sections: processedDocument.sections,
        },
        input.options
      );

      if (drafts.length === 0) {
        throw new ChunkingFailedError(sourceId, "chunking produced no chunks");
      }

      await this.persistChunks(organizationId, sourceId, drafts);

      await KnowledgeSource.updateOne(
        { _id: sourceId, organizationId },
        { $set: { status: "chunked" }, $unset: { processingError: "" } }
      );

      return { sourceId, chunkCount: drafts.length, chunks: drafts };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await KnowledgeSource.updateOne(
        { _id: sourceId, organizationId },
        { $set: { status: "failed", processingError: message } }
      );

      throw error;
    }
  }

  /**
   * Replaces this source's existing chunks (scoped strictly to this
   * organizationId + sourceId) so re-processing never leaves duplicates.
   * Never touches chunks belonging to any other source or organization.
   */
  private async persistChunks(
    organizationId: string,
    sourceId: string,
    drafts: ChunkDraft[]
  ): Promise<void> {
    await KnowledgeChunk.deleteMany({ organizationId, sourceId });

    const documents = drafts.map((draft, index) => ({
      organizationId,
      sourceId,
      chunkIndex: index,
      text: draft.text,
      tokenCount: draft.tokenCount,
      metadata: draft.metadata,
    }));

    await KnowledgeChunk.insertMany(documents, { ordered: true });
  }
}

export const chunkingService = new ChunkingService();
