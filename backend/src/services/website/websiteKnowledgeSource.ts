import { Types } from "mongoose";
import KnowledgeSource, { IKnowledgeSource } from "../../models/KnowledgeSource";
import { InvalidWebsiteUrlError } from "./errors";
import { WebsitePage } from "./types";

export interface CreateKnowledgeSourceForPageInput {
  organizationId: string;
  uploadedBy: string;
  page: WebsitePage;
}

/** Derives a stable, human-readable filename from a crawled page's URL (hostname + path, no query/fragment). */
export function deriveFilenameFromUrl(pageUrl: string): string {
  const url = new URL(pageUrl);
  const path = url.pathname === "/" ? "" : url.pathname;
  return `${url.hostname}${path}`;
}

/**
 * Step 6 -> Step 1 bridge: represents a single crawled+extracted+cleaned
 * page as a KnowledgeSource (type "url"), the same model used by uploaded
 * documents.
 *
 * Status is set to "parsed" - text has already been extracted and cleaned
 * (equivalent to Step 2's output), so it is ready for Step 3 (chunking)
 * exactly like a parsed document, but it is deliberately NOT "chunked",
 * "embedded", or "ready" since none of that has happened yet. No OpenAI
 * call, no embedding, and no KnowledgeChunk is created here.
 *
 * `page.text` is already directly usable as a ProcessedDocumentResult.text
 * value for the existing ChunkingService - no conversion needed.
 */
export async function createKnowledgeSourceForPage(
  input: CreateKnowledgeSourceForPageInput
): Promise<IKnowledgeSource> {
  const { organizationId, uploadedBy, page } = input;

  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidWebsiteUrlError("organizationId is missing or invalid");
  }

  if (!uploadedBy || !Types.ObjectId.isValid(uploadedBy)) {
    throw new InvalidWebsiteUrlError("uploadedBy is missing or invalid");
  }

  if (!page || !page.url) {
    throw new InvalidWebsiteUrlError("page is missing or has no url");
  }

  return KnowledgeSource.create({
    organizationId,
    uploadedBy,
    filename: deriveFilenameFromUrl(page.url),
    type: "url",
    status: "parsed",
    metadata: {
      url: page.url,
      title: page.title,
      pageType: page.pageType,
      canonicalUrl: page.canonicalUrl,
      metaDescription: page.metaDescription,
      headings: page.headings,
      depth: page.depth,
      discoveredFrom: page.discoveredFrom,
      extractedText: page.text,
    },
  });
}

/**
 * Convenience wrapper for a full crawl: creates one KnowledgeSource per
 * successfully crawled page. Pages that failed to crawl (see
 * WebsiteCrawlResult.errors) never reach this function - only pages that
 * were actually fetched, extracted, and cleaned are represented.
 */
export async function createKnowledgeSourcesForPages(
  organizationId: string,
  uploadedBy: string,
  pages: WebsitePage[]
): Promise<IKnowledgeSource[]> {
  const sources: IKnowledgeSource[] = [];
  for (const page of pages) {
    sources.push(await createKnowledgeSourceForPage({ organizationId, uploadedBy, page }));
  }
  return sources;
}
