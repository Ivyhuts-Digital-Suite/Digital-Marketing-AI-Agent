import dns from "node:dns";
import net from "node:net";
import { InvalidWebsiteUrlError, UnsafeWebsiteUrlError } from "./errors";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Extensions the crawler never fetches - images, video, audio, archives, binaries, office/data files. */
const UNSUPPORTED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff", ".avif",
  ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v",
  ".mp3", ".wav", ".ogg", ".flac", ".m4a",
  ".pdf", ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz",
  ".exe", ".msi", ".dmg", ".apk", ".bin", ".sh", ".bat",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv",
  ".css", ".js", ".mjs", ".json", ".xml", ".rss", ".atom",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
]);

/** Query params that are never meaningful for page identity/content. */
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "mc_cid", "mc_eid", "ref",
]);

const LOCALHOST_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"]);

export type HostnameResolver = (hostname: string) => Promise<string[]>;

export const defaultHostnameResolver: HostnameResolver = async (hostname) => {
  const results = await dns.promises.lookup(hostname, { all: true });
  return results.map((entry) => entry.address);
};

export function isHttpUrl(url: URL): boolean {
  return ALLOWED_PROTOCOLS.has(url.protocol);
}

export function stripWww(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

/** True if url belongs to the same site as rootHostname (www-insensitive). External hosts are never internal. */
export function isInternalUrl(url: URL, rootHostname: string): boolean {
  return stripWww(url.hostname) === stripWww(rootHostname);
}

/** Resolves a possibly-relative href against the current page URL. Returns null instead of throwing on malformed input. */
export function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Deterministic URL normalization so trivially-different URLs
 * (fragment-only, trailing slash, default port, tracking params, case)
 * collapse to the same crawl key.
 */
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) {
    url.port = "";
  }

  for (const key of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const query = url.searchParams.toString();
  const port = url.port ? `:${url.port}` : "";
  return `${url.protocol}//${url.hostname}${port}${url.pathname}${query ? `?${query}` : ""}`;
}

/** True if the path/URL points at a resource type the crawler intentionally never fetches. */
export function looksLikeUnsupportedResource(pathOrUrl: string): boolean {
  let pathname = pathOrUrl;
  try {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      pathname = new URL(pathOrUrl).pathname;
    }
  } catch {
    // fall through and match against the raw string
  }

  const match = /\.[a-z0-9]+$/i.exec(pathname);
  if (!match) {
    return false;
  }
  return UNSUPPORTED_EXTENSIONS.has(match[0].toLowerCase());
}

function isPrivateOrReservedIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true; // malformed - fail closed
  }
  const [a, b] = parts;
  if (a === 0) return true; // "this network"
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT (RFC6598)
  return false;
}

function isPrivateOrReservedIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local fc00::/7
  if (/^fe[89ab]/.test(normalized)) return true; // link-local fe80::/10

  const mappedMatch = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mappedMatch) {
    return isPrivateOrReservedIPv4(mappedMatch[1]);
  }

  return false;
}

export function isPrivateOrReservedIp(address: string): boolean {
  if (net.isIPv4(address)) return isPrivateOrReservedIPv4(address);
  if (net.isIPv6(address)) return isPrivateOrReservedIPv6(address);
  return true; // unrecognized shape - fail closed
}

/**
 * SSRF protection. Rejects localhost keywords and loopback/private/
 * link-local/reserved IP ranges - checking the literal hostname first (no
 * network call), then resolving DNS names to confirm the address they
 * point at is public. `resolve` is injectable so tests can exercise this
 * without depending on real DNS/internet access.
 */
export async function assertPubliclyRoutableHost(
  hostname: string,
  resolve: HostnameResolver = defaultHostnameResolver
): Promise<void> {
  const bare = hostname.replace(/^\[/, "").replace(/\]$/, "");

  if (LOCALHOST_HOSTNAMES.has(bare.toLowerCase())) {
    throw new UnsafeWebsiteUrlError(`hostname "${hostname}" refers to localhost`);
  }

  if (net.isIP(bare)) {
    if (isPrivateOrReservedIp(bare)) {
      throw new UnsafeWebsiteUrlError(`hostname "${hostname}" is a private/loopback/reserved IP address`);
    }
    return;
  }

  let addresses: string[];
  try {
    addresses = await resolve(bare);
  } catch {
    throw new UnsafeWebsiteUrlError(`hostname "${hostname}" could not be resolved`);
  }

  if (addresses.length === 0) {
    throw new UnsafeWebsiteUrlError(`hostname "${hostname}" did not resolve to any address`);
  }

  for (const address of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new UnsafeWebsiteUrlError(
        `hostname "${hostname}" resolves to a private/internal address (${address})`
      );
    }
  }
}

/**
 * Full validation for a user-supplied website URL: must be present, must
 * parse, must be http(s) only (javascript:/file:/data:/etc. are rejected),
 * and must not point at localhost or a private/internal network.
 */
export async function validateWebsiteUrl(
  rawUrl: string,
  resolve: HostnameResolver = defaultHostnameResolver
): Promise<URL> {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new InvalidWebsiteUrlError("URL must be present");
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new InvalidWebsiteUrlError(`"${rawUrl}" is not a valid URL`);
  }

  if (!isHttpUrl(url)) {
    throw new InvalidWebsiteUrlError(
      `unsupported protocol "${url.protocol}" - only http and https are allowed`
    );
  }

  if (!url.hostname) {
    throw new InvalidWebsiteUrlError("URL must include a hostname");
  }

  await assertPubliclyRoutableHost(url.hostname, resolve);

  return url;
}
