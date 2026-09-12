/**
 * Step 6: Website Intelligence types.
 *
 * Deterministic data shapes only - no AI/LLM involvement anywhere in this
 * module. `pageType` is a rule-based classification (see
 * websitePageClassifier.ts), not an AI classification.
 */

export type WebsitePageType =
  | "ABOUT"
  | "PRODUCTS"
  | "SERVICES"
  | "PRICING"
  | "SOLUTIONS"
  | "CONTACT"
  | "COMPANY"
  | "CASE_STUDY"
  | "OTHER";

export interface WebsitePage {
  url: string;
  title?: string;
  headings: string[];
  /** Cleaned, chunker-ready text. Raw HTML is not retained on this type. */
  text: string;
  metaDescription?: string;
  canonicalUrl?: string;
  pageType: WebsitePageType;
  depth: number;
  discoveredFrom?: string;
}

export interface WebsitePageError {
  url: string;
  depth: number;
  discoveredFrom?: string;
  error: string;
}

export interface WebsiteCrawlOptions {
  /** Maximum number of pages to fetch and extract. Falls back to WEBSITE_MAX_PAGES. */
  maxPages?: number;
  /** Per-request timeout in ms. Falls back to WEBSITE_REQUEST_TIMEOUT_MS. */
  requestTimeoutMs?: number;
  /** Maximum bytes read from any single response body. Falls back to WEBSITE_MAX_RESPONSE_BYTES. */
  maxResponseBytes?: number;
}

export interface WebsiteCrawlResult {
  startUrl: string;
  pages: WebsitePage[];
  /** Every internal URL discovered (whether or not it was ultimately crawled). */
  discoveredUrls: string[];
  crawledCount: number;
  failedCount: number;
  /** Per-page failures. A broken page never aborts the rest of the crawl. */
  errors: WebsitePageError[];
}
