export class InvalidVectorSearchInputError extends Error {
  constructor(reason: string) {
    super(`Invalid vector search input: ${reason}`);
    this.name = "InvalidVectorSearchInputError";
  }
}

export class VectorSearchConfigurationError extends Error {
  constructor(reason: string) {
    super(`Vector search is not configured correctly: ${reason}`);
    this.name = "VectorSearchConfigurationError";
  }
}

export class VectorSearchExecutionError extends Error {
  constructor(reason: string) {
    super(`Vector search failed: ${reason}`);
    this.name = "VectorSearchExecutionError";
  }
}
