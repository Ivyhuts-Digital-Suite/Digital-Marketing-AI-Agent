import { estimateTokenCount, tokensToChars } from "./tokenEstimator";

/**
 * Target chunk size: ~500-1000 tokens (approximated, see tokenEstimator.ts).
 * Overlap between consecutive chunks: ~100-150 tokens.
 * These are targets, not hard guarantees — the final chunk of a unit (page/
 * section) may be smaller, and chunking prefers paragraph/sentence
 * boundaries over hitting an exact size.
 */
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_OVERLAP_TOKENS = 125;

const HEADING_PATTERN = /^#{1,6}\s+(.+)$/;

export interface ChunkMetadataDraft {
  page?: number;
  section?: string;
  heading?: string;
}

export interface ChunkDraft {
  text: string;
  tokenCount: number;
  metadata?: ChunkMetadataDraft;
}

export interface SplitTextPage {
  pageNumber: number;
  text: string;
}

export interface SplitTextSection {
  heading?: string;
  text: string;
}

export interface SplitTextInput {
  text: string;
  pages?: SplitTextPage[];
  sections?: SplitTextSection[];
}

export interface ChunkingOptions {
  /** Soft upper bound on tokens per chunk (approximate). Default 1000. */
  maxTokens?: number;
  /** Approximate token overlap carried into the next chunk. Default 125. */
  overlapTokens?: number;
}

interface Unit {
  text: string;
  page?: number;
  section?: string;
}

function resolveUnits(input: SplitTextInput): Unit[] {
  if (input.pages && input.pages.length > 0) {
    return input.pages
      .filter((page) => page.text && page.text.trim().length > 0)
      .map((page) => ({ text: page.text, page: page.pageNumber }));
  }

  if (input.sections && input.sections.length > 0) {
    return input.sections
      .filter((section) => section.text && section.text.trim().length > 0)
      .map((section) => ({ text: section.text, section: section.heading }));
  }

  return input.text && input.text.trim().length > 0 ? [{ text: input.text }] : [];
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/** Simple deterministic sentence split — no NLP library. */
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return (matches ?? [text]).map((sentence) => sentence.trim()).filter((s) => s.length > 0);
}

function takeOverlapTail(text: string, overlapTokens: number): string {
  const overlapChars = tokensToChars(overlapTokens);

  if (overlapChars <= 0 || text.length <= overlapChars) {
    return text;
  }

  const tail = text.slice(text.length - overlapChars);
  const firstSpace = tail.indexOf(" ");
  // Avoid starting the overlap mid-word.
  return firstSpace === -1 ? tail : tail.slice(firstSpace + 1);
}

function buildMetadata(unit: Unit, heading?: string): ChunkMetadataDraft | undefined {
  const metadata: ChunkMetadataDraft = {};

  if (unit.page !== undefined) {
    metadata.page = unit.page;
  }

  if (unit.section) {
    metadata.section = unit.section;
  }

  if (heading) {
    metadata.heading = heading;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Packs a list of pieces (sentences) into maxTokens-sized groups joined by
 * `joiner`. Used as the fallback when a single paragraph exceeds maxTokens.
 * If even a single piece exceeds maxTokens on its own (pathological case,
 * e.g. one huge run-on sentence with no punctuation), it is hard-split by
 * character count as a last resort safety net so no chunk ever exceeds the
 * budget indefinitely.
 */
function packPieces(
  pieces: string[],
  joiner: string,
  emit: (piece: string) => void,
  maxTokens: number
): void {
  let buffer = "";

  for (const piece of pieces) {
    if (estimateTokenCount(piece) > maxTokens) {
      if (buffer.trim().length > 0) {
        emit(buffer);
        buffer = "";
      }

      const hardChars = tokensToChars(maxTokens);
      let remaining = piece;

      while (remaining.length > hardChars) {
        emit(remaining.slice(0, hardChars));
        remaining = remaining.slice(hardChars);
      }

      buffer = remaining;
      continue;
    }

    const candidate = buffer ? `${buffer}${joiner}${piece}` : piece;

    if (buffer.length > 0 && estimateTokenCount(candidate) > maxTokens) {
      emit(buffer);
      buffer = piece;
    } else {
      buffer = candidate;
    }
  }

  if (buffer.trim().length > 0) {
    emit(buffer);
  }
}

/**
 * Deterministic, paragraph/heading-aware chunking. No LLM calls, no
 * embeddings — this only splits already-extracted text (from Step 2)
 * into KnowledgeChunk-ready pieces.
 */
export function splitIntoChunks(input: SplitTextInput, options: ChunkingOptions = {}): ChunkDraft[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

  const units = resolveUnits(input);
  const chunks: ChunkDraft[] = [];

  for (const unit of units) {
    let currentHeading: string | undefined = unit.section;
    let previousChunkText: string | undefined;

    // Emits one finished chunk of raw (non-overlapped) text: prepends the
    // overlap tail from this unit's previous chunk, then records it.
    // Overlap never crosses a unit (page/section) boundary, so metadata
    // stays accurate.
    const emit = (rawPiece: string): void => {
      const trimmedPiece = rawPiece.trim();
      if (!trimmedPiece) {
        return;
      }

      const overlap = previousChunkText ? takeOverlapTail(previousChunkText, overlapTokens) : "";
      const combined = overlap ? `${overlap}\n\n${trimmedPiece}` : trimmedPiece;
      const finalText = combined.trim();

      if (!finalText) {
        return;
      }

      chunks.push({
        text: finalText,
        tokenCount: estimateTokenCount(finalText),
        metadata: buildMetadata(unit, currentHeading),
      });

      previousChunkText = finalText;
    };

    const paragraphs = splitParagraphs(unit.text);
    let buffer = "";

    for (const paragraph of paragraphs) {
      const headingMatch = HEADING_PATTERN.exec(paragraph);
      if (headingMatch) {
        currentHeading = headingMatch[1].trim();
      }

      if (estimateTokenCount(paragraph) > maxTokens) {
        if (buffer.trim().length > 0) {
          emit(buffer);
          buffer = "";
        }

        const sentences = splitSentences(paragraph);
        packPieces(sentences, " ", emit, maxTokens);
        continue;
      }

      const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

      if (buffer.length > 0 && estimateTokenCount(candidate) > maxTokens) {
        emit(buffer);
        buffer = paragraph;
      } else {
        buffer = candidate;
      }
    }

    if (buffer.trim().length > 0) {
      emit(buffer);
    }
  }

  return chunks;
}
