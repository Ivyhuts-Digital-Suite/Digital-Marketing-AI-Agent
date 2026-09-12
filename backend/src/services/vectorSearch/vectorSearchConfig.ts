import { VectorSearchConfigurationError } from "./errors";

const DEFAULT_INDEX_NAME = "knowledge_chunks_vector_index";
const DEFAULT_PATH = "embedding";
const DEFAULT_NUM_CANDIDATES = 100;

export interface VectorSearchConfig {
  indexName: string;
  path: string;
  /**
   * Expected embedding vector length. Not defaulted anywhere in code: the
   * embedding implementation does not itself pin a dimension, so this is
   * only ever known via VECTOR_DIMENSIONS. Undefined means "unknown / not
   * enforced" rather than "any particular number".
   */
  dimensions?: number;
  numCandidates: number;
}

function parsePositiveInt(raw: string, envVarName: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new VectorSearchConfigurationError(
      `${envVarName} must be a positive integer, got "${raw}"`
    );
  }
  return value;
}

/**
 * Reads the Atlas Vector Search configuration from the environment.
 *
 * Deliberately separate from the normal mongoose schema indexes declared
 * on KnowledgeChunk (compound org/source/chunkIndex uniqueness index) -
 * this config only describes the Atlas Search vector index used by
 * $vectorSearch aggregation stages.
 */
export function getVectorSearchConfig(): VectorSearchConfig {
  const indexName = process.env.VECTOR_INDEX_NAME?.trim() || DEFAULT_INDEX_NAME;
  const path = process.env.VECTOR_PATH?.trim() || DEFAULT_PATH;

  if (indexName.length === 0) {
    throw new VectorSearchConfigurationError("VECTOR_INDEX_NAME must not be empty");
  }

  if (path.length === 0) {
    throw new VectorSearchConfigurationError("VECTOR_PATH must not be empty");
  }

  const rawDimensions = process.env.VECTOR_DIMENSIONS?.trim();
  const dimensions = rawDimensions ? parsePositiveInt(rawDimensions, "VECTOR_DIMENSIONS") : undefined;

  const rawNumCandidates = process.env.VECTOR_NUM_CANDIDATES?.trim();
  const numCandidates = rawNumCandidates
    ? parsePositiveInt(rawNumCandidates, "VECTOR_NUM_CANDIDATES")
    : DEFAULT_NUM_CANDIDATES;

  return { indexName, path, dimensions, numCandidates };
}
