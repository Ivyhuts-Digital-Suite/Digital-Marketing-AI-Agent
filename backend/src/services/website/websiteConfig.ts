import { WebsiteConfigurationError } from "./errors";

const DEFAULT_MAX_PAGES = 20;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface WebsiteCrawlerConfig {
  maxPages: number;
  requestTimeoutMs: number;
  maxResponseBytes: number;
}

function parsePositiveInt(raw: string, envVarName: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new WebsiteConfigurationError(`${envVarName} must be a positive integer, got "${raw}"`);
  }
  return value;
}

/** Reads crawler limits from the environment, applying sensible defaults when unset. */
export function getWebsiteCrawlerConfig(): WebsiteCrawlerConfig {
  const rawMaxPages = process.env.WEBSITE_MAX_PAGES?.trim();
  const maxPages = rawMaxPages ? parsePositiveInt(rawMaxPages, "WEBSITE_MAX_PAGES") : DEFAULT_MAX_PAGES;

  const rawTimeout = process.env.WEBSITE_REQUEST_TIMEOUT_MS?.trim();
  const requestTimeoutMs = rawTimeout
    ? parsePositiveInt(rawTimeout, "WEBSITE_REQUEST_TIMEOUT_MS")
    : DEFAULT_REQUEST_TIMEOUT_MS;

  const rawMaxBytes = process.env.WEBSITE_MAX_RESPONSE_BYTES?.trim();
  const maxResponseBytes = rawMaxBytes
    ? parsePositiveInt(rawMaxBytes, "WEBSITE_MAX_RESPONSE_BYTES")
    : DEFAULT_MAX_RESPONSE_BYTES;

  return { maxPages, requestTimeoutMs, maxResponseBytes };
}
