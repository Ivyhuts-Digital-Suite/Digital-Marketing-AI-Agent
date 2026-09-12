import mongoose, { Types } from "mongoose";
import KnowledgeSource, { KnowledgeSourceStatus } from "../../models/KnowledgeSource";
import KnowledgeChunk from "../../models/KnowledgeChunk";
import { CompanyIntelligenceContext, ContextExcerpt } from "./types";

/**
 * Step 7 context strategy.
 *
 * Thousands of chunks may exist for an organization, so this deliberately
 * does NOT send everything to the LLM. Instead it:
 *   1. Only looks at KnowledgeSources that have usable extracted text
 *      (status parsed/chunked/embedded/ready - never "uploaded"/
 *      "processing"/"failed").
 *   2. Prioritizes sources that are most likely to describe the company
 *      itself (important website page types, then uploaded documents,
 *      then other website pages) over everything else.
 *   3. Pulls only a handful of representative KnowledgeChunks per source
 *      (or, for website pages that haven't been chunked yet, a bounded
 *      excerpt of their extracted text).
 *   4. Stops once a fixed total-character budget is reached.
 *
 * This is bounded and fully deterministic - no vector search is used
 * here. VectorSearchService (Step 5) exists and could rank chunks by
 * relevance to specific questions in a future iteration, but it depends
 * on an Atlas Search index that has not been provisioned yet, so wiring
 * it in now would be an untestable, silently-fragile shortcut. Once that
 * index exists, swapping this sampling step for real semantic retrieval
 * is a natural follow-up - not something to fake here.
 */

const MAX_SOURCES_TO_CONSIDER = 40;
const MAX_SOURCES_IN_CONTEXT = 15;
const MAX_CHUNKS_PER_SOURCE = 5;
const MAX_CHARS_PER_EXCERPT = 1500;
const MAX_TOTAL_CONTEXT_CHARS = 12_000;

const USABLE_STATUSES: KnowledgeSourceStatus[] = ["parsed", "chunked", "embedded", "ready"];

const IMPORTANT_WEBSITE_PAGE_TYPES = new Set([
  "ABOUT",
  "PRODUCTS",
  "SERVICES",
  "PRICING",
  "SOLUTIONS",
  "COMPANY",
  "CASE_STUDY",
]);

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}...`;
}

interface SourceLike {
  _id: Types.ObjectId;
  type: string;
  filename: string;
  metadata?: Record<string, unknown>;
}

/** Higher score = more likely to describe the company itself; used only to pick which sources make the cut. */
function scoreSource(source: SourceLike): number {
  if (source.type === "url") {
    const pageType = typeof source.metadata?.pageType === "string" ? source.metadata.pageType : undefined;
    return pageType && IMPORTANT_WEBSITE_PAGE_TYPES.has(pageType) ? 3 : 1;
  }
  return 2; // uploaded documents were deliberately provided by the user - treat as generally relevant
}

/**
 * Best-effort read of onboarding data from an "Organization" model, IF one
 * is registered with mongoose elsewhere in the app. This codebase does not
 * define an Organization model yet, so this currently always returns
 * null - it is written this way (rather than importing a model directly)
 * so it activates automatically, with no changes needed here, once one is
 * added.
 */
async function tryGetOnboardingData(organizationId: string): Promise<Record<string, unknown> | null> {
  if (!mongoose.modelNames().includes("Organization")) {
    return null;
  }

  try {
    const OrganizationModel = mongoose.model("Organization");
    const doc = await OrganizationModel.findById(organizationId).lean();
    return doc ? (doc as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function gatherCompanyIntelligenceContext(organizationId: string): Promise<CompanyIntelligenceContext> {
  const onboarding = await tryGetOnboardingData(organizationId);

  const sources = (await KnowledgeSource.find({
    organizationId,
    status: { $in: USABLE_STATUSES },
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_SOURCES_TO_CONSIDER)
    .lean()) as unknown as SourceLike[];

  const prioritized = [...sources].sort((a, b) => scoreSource(b) - scoreSource(a));
  const candidates = prioritized.slice(0, MAX_SOURCES_IN_CONTEXT);

  const excerpts: ContextExcerpt[] = [];
  let totalCharacters = 0;
  let chunksUsed = 0;

  for (const source of candidates) {
    if (totalCharacters >= MAX_TOTAL_CONTEXT_CHARS) break;

    const chunks = await KnowledgeChunk.find({ organizationId, sourceId: source._id })
      .sort({ chunkIndex: 1 })
      .limit(MAX_CHUNKS_PER_SOURCE)
      .lean();

    let text: string;
    let chunkIds: string[];

    if (chunks.length > 0) {
      text = chunks.map((chunk) => chunk.text).join("\n\n");
      chunkIds = chunks.map((chunk) => chunk._id.toString());
    } else if (source.type === "url" && typeof source.metadata?.extractedText === "string") {
      text = source.metadata.extractedText;
      chunkIds = [];
    } else {
      continue; // nothing usable for this source yet
    }

    let bounded = truncate(text, MAX_CHARS_PER_EXCERPT);
    if (bounded.trim().length === 0) continue;

    const remaining = MAX_TOTAL_CONTEXT_CHARS - totalCharacters;
    if (remaining <= 0) break;
    if (bounded.length > remaining) {
      bounded = truncate(bounded, remaining);
    }

    excerpts.push({
      sourceType: source.type === "url" ? "url" : "document",
      sourceId: source._id.toString(),
      label: source.filename,
      url: typeof source.metadata?.url === "string" ? source.metadata.url : undefined,
      pageType: typeof source.metadata?.pageType === "string" ? source.metadata.pageType : undefined,
      text: bounded,
      chunkIds,
    });
    totalCharacters += bounded.length;
    chunksUsed += chunkIds.length;
  }

  return {
    organizationId,
    onboarding,
    excerpts,
    totalCharacters,
    chunksUsed,
  };
}
