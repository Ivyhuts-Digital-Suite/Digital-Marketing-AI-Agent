import {
  HostnameResolver,
  defaultHostnameResolver,
  isHttpUrl,
  isInternalUrl,
  looksLikeUnsupportedResource,
  normalizeUrl,
  resolveUrl,
  validateWebsiteUrl,
} from "./websiteUrlUtils";
import { extractHtmlContent } from "./websiteExtractor";
import { cleanWebsiteText } from "./websiteTextCleaner";
import { classifyPage } from "./websitePageClassifier";
import { getWebsiteCrawlerConfig } from "./websiteConfig";
import { WebsitePageFetchError } from "./errors";
import { WebsiteCrawlOptions, WebsiteCrawlResult, WebsitePage, WebsitePageError } from "./types";

const HTML_LIKE_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
const MAX_REDIRECTS = 5;
/** Hard ceiling on how many URLs we ever remember discovering, independent of maxPages, so a page with thousands of links can't exhaust memory. */
const MAX_DISCOVERED_MULTIPLIER = 20;

export type FetchImpl = typeof fetch;

interface QueueItem {
  url: string;
  depth: number;
  discoveredFrom?: string;
}

interface FetchedPage {
  html: string;
  finalUrl: string;
}

/**
 * Step 6: Website Intelligence crawler.
 *
 * website URL -> discover internal pages -> fetch HTML -> extract content
 * -> clean text -> classify page. Does not call an LLM, does not generate
 * embeddings, and does not run vector search - it only prepares crawled
 * pages so they can later be turned into KnowledgeSources (see
 * websiteKnowledgeSource.ts) and, from there, fed through the existing
 * chunking/embedding pipeline untouched.
 *
 * fetchImpl and resolveHostname are injectable so tests can exercise the
 * full crawl/discovery/SSRF-check flow deterministically, without real
 * network or DNS access.
 */
export class WebsiteCrawlerService {
  constructor(
    private readonly fetchImpl: FetchImpl = fetch,
    private readonly resolveHostname: HostnameResolver = defaultHostnameResolver
  ) {}

  async crawlWebsite(startUrl: string, options: WebsiteCrawlOptions = {}): Promise<WebsiteCrawlResult> {
    const config = getWebsiteCrawlerConfig();
    const maxPages = options.maxPages ?? config.maxPages;
    const requestTimeoutMs = options.requestTimeoutMs ?? config.requestTimeoutMs;
    const maxResponseBytes = options.maxResponseBytes ?? config.maxResponseBytes;

    const startUrlObj = await validateWebsiteUrl(startUrl, this.resolveHostname);
    const rootHostname = startUrlObj.hostname;
    const normalizedStart = normalizeUrl(startUrlObj.toString());
    const maxDiscovered = Math.max(maxPages * MAX_DISCOVERED_MULTIPLIER, maxPages);

    const visited = new Set<string>();
    const discovered = new Set<string>([normalizedStart]);
    const queue: QueueItem[] = [{ url: normalizedStart, depth: 0 }];

    const pages: WebsitePage[] = [];
    const errors: WebsitePageError[] = [];

    while (queue.length > 0 && pages.length < maxPages) {
      const current = queue.shift();
      if (!current || visited.has(current.url)) {
        continue;
      }
      visited.add(current.url);

      if (looksLikeUnsupportedResource(current.url)) {
        continue;
      }

      let fetched: FetchedPage | null;
      try {
        fetched = await this.fetchHtmlPage(
          current.url,
          rootHostname,
          requestTimeoutMs,
          maxResponseBytes
        );
      } catch (error) {
        errors.push({
          url: current.url,
          depth: current.depth,
          discoveredFrom: current.discoveredFrom,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      if (fetched === null) {
        continue; // not HTML - unsupported resource, silently skipped
      }

      // A redirect may land on a URL already reached via a different path
      // (e.g. two distinct links that both resolve to the same final
      // page). Re-check `visited` against the post-redirect URL so that
      // page is never processed/returned twice.
      const normalizedFinalUrl = normalizeUrl(fetched.finalUrl);
      if (normalizedFinalUrl !== current.url) {
        if (visited.has(normalizedFinalUrl)) {
          continue;
        }
        visited.add(normalizedFinalUrl);
      }

      try {
        const extracted = extractHtmlContent(fetched.html, fetched.finalUrl);
        const text = cleanWebsiteText(extracted.text);
        const pageType = classifyPage(fetched.finalUrl, extracted.title, extracted.headings);

        pages.push({
          url: fetched.finalUrl,
          title: extracted.title,
          headings: extracted.headings,
          text,
          metaDescription: extracted.metaDescription,
          canonicalUrl: extracted.canonicalUrl,
          pageType,
          depth: current.depth,
          discoveredFrom: current.discoveredFrom,
        });

        if (discovered.size < maxDiscovered) {
          this.enqueueLinks(extracted.links, fetched.finalUrl, rootHostname, current, discovered, queue);
        }
      } catch (error) {
        errors.push({
          url: current.url,
          depth: current.depth,
          discoveredFrom: current.discoveredFrom,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      startUrl: normalizedStart,
      pages,
      discoveredUrls: Array.from(discovered),
      crawledCount: pages.length,
      failedCount: errors.length,
      errors,
    };
  }

  private enqueueLinks(
    rawLinks: string[],
    baseUrl: string,
    rootHostname: string,
    current: QueueItem,
    discovered: Set<string>,
    queue: QueueItem[]
  ): void {
    for (const rawHref of rawLinks) {
      const resolved = resolveUrl(rawHref, baseUrl);
      if (!resolved) continue;

      let candidate: URL;
      try {
        candidate = new URL(resolved);
      } catch {
        continue;
      }

      if (!isHttpUrl(candidate)) continue;
      if (!isInternalUrl(candidate, rootHostname)) continue;
      if (looksLikeUnsupportedResource(candidate.pathname)) continue;

      const normalized = normalizeUrl(candidate.toString());
      if (discovered.has(normalized)) continue;

      discovered.add(normalized);
      queue.push({ url: normalized, depth: current.depth + 1, discoveredFrom: baseUrl });
    }
  }

  /**
   * Fetches one URL as HTML, following redirects manually (re-validating
   * SSRF safety and internal-domain scoping on every hop) and enforcing a
   * response size cap. Returns null when the resource is not HTML (skipped
   * as an unsupported resource, not an error).
   */
  private async fetchHtmlPage(
    url: string,
    rootHostname: string,
    timeoutMs: number,
    maxBytes: number
  ): Promise<FetchedPage | null> {
    let currentUrl = url;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const urlObj = await validateWebsiteUrl(currentUrl, this.resolveHostname);

      if (!isInternalUrl(urlObj, rootHostname)) {
        throw new WebsitePageFetchError(`redirected to an external host: ${urlObj.hostname}`);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await this.fetchImpl(urlObj.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "CompanyIntelligenceBot/1.0 (+website-intelligence)" },
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new WebsitePageFetchError(`request to "${currentUrl}" timed out after ${timeoutMs}ms`);
        }
        throw new WebsitePageFetchError(
          `request to "${currentUrl}" failed: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        clearTimeout(timer);
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new WebsitePageFetchError(`received redirect status ${response.status} with no Location header`);
        }
        const nextUrl = resolveUrl(location, urlObj.toString());
        if (!nextUrl) {
          throw new WebsitePageFetchError(`redirect Location header is not a valid URL: ${location}`);
        }
        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        throw new WebsitePageFetchError(`received HTTP ${response.status} for "${urlObj.toString()}"`);
      }

      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const isHtml = HTML_LIKE_CONTENT_TYPES.some((type) => contentType.includes(type));
      if (!isHtml) {
        return null;
      }

      const html = await this.readBodyWithLimit(response, maxBytes, urlObj.toString());
      return { html, finalUrl: urlObj.toString() };
    }

    throw new WebsitePageFetchError(`too many redirects starting from "${url}"`);
  }

  private async readBodyWithLimit(response: Response, maxBytes: number, url: string): Promise<string> {
    if (!response.body) {
      return await response.text();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new WebsitePageFetchError(`response for "${url}" exceeded the ${maxBytes}-byte limit`);
        }
        chunks.push(value);
      }
    }

    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf-8");
  }
}

export const websiteCrawlerService = new WebsiteCrawlerService();
