/**
 * Deterministic token approximation used only for chunk-sizing decisions.
 *
 * This is NOT a real tokenizer (no tiktoken/BPE). It uses the common,
 * well-documented heuristic of ~4 characters per token for English text,
 * which is accurate enough to keep chunks roughly within a target token
 * budget without pulling in a large tokenizer dependency for this step.
 *
 * If a real tokenizer is introduced later, swap the implementation of
 * `estimateTokenCount` — callers only depend on this function's signature.
 */
const CHARS_PER_TOKEN_APPROX = 4;

export function estimateTokenCount(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN_APPROX));
}

export function tokensToChars(tokens: number): number {
  return Math.max(0, Math.round(tokens * CHARS_PER_TOKEN_APPROX));
}
