export class InvalidChunkingInputError extends Error {
  constructor(reason: string) {
    super(`Invalid chunking input: ${reason}`);
    this.name = "InvalidChunkingInputError";
  }
}

export class ChunkingFailedError extends Error {
  constructor(sourceId: string, reason: string) {
    super(`Chunking failed for source "${sourceId}": ${reason}`);
    this.name = "ChunkingFailedError";
  }
}
