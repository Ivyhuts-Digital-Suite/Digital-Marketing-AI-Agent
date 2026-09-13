export class InvalidEmbeddingInputError extends Error {
  constructor(reason: string) {
    super(`Invalid embedding input: ${reason}`);
    this.name = "InvalidEmbeddingInputError";
  }
}

export class EmbeddingConfigurationError extends Error {
  constructor(reason: string) {
    super(`Embedding service is not configured correctly: ${reason}`);
    this.name = "EmbeddingConfigurationError";
  }
}

export class EmbeddingGenerationError extends Error {
  constructor(reason: string) {
    super(`Failed to generate embeddings: ${reason}`);
    this.name = "EmbeddingGenerationError";
  }
}

export class EmptySourceError extends Error {
  constructor(sourceId: string) {
    super(`No KnowledgeChunks found for source "${sourceId}".`);
    this.name = "EmptySourceError";
  }
}
