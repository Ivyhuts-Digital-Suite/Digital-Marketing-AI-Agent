export class InvalidWebsiteUrlError extends Error {
  constructor(reason: string) {
    super(`Invalid website URL: ${reason}`);
    this.name = "InvalidWebsiteUrlError";
  }
}

/** Raised by SSRF protection - protocol was allowed but the target host is unsafe to reach. */
export class UnsafeWebsiteUrlError extends Error {
  constructor(reason: string) {
    super(`Unsafe website URL: ${reason}`);
    this.name = "UnsafeWebsiteUrlError";
  }
}

export class WebsiteConfigurationError extends Error {
  constructor(reason: string) {
    super(`Website crawler is not configured correctly: ${reason}`);
    this.name = "WebsiteConfigurationError";
  }
}

/** A single page/request failure during a crawl. Captured per-page; never thrown to abort a whole crawl. */
export class WebsitePageFetchError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "WebsitePageFetchError";
  }
}

/** Thrown only when the crawl cannot proceed at all (e.g. the start URL itself is unreachable). */
export class WebsiteCrawlFailedError extends Error {
  constructor(startUrl: string, reason: string) {
    super(`Website crawl failed for "${startUrl}": ${reason}`);
    this.name = "WebsiteCrawlFailedError";
  }
}
