import * as cheerio from "cheerio";
import { resolveUrl } from "./websiteUrlUtils";

export interface ExtractedHtmlContent {
  title?: string;
  headings: string[];
  /** Reading-order text, headings pre-marked as markdown ("# ", "## ", ...) so it stays compatible with ChunkingService's heading detection. */
  text: string;
  metaDescription?: string;
  canonicalUrl?: string;
  /** Raw, unresolved href strings straight out of the markup. */
  links: string[];
}

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "iframe",
  "svg",
  "form",
  "button",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[aria-hidden='true']",
  ".cookie-banner",
  ".cookie-consent",
  "#cookie-banner",
];

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const TEXT_TAGS = [...HEADING_TAGS, "p", "li", "blockquote"];

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic HTML -> structured content extraction (Step 6). No LLM
 * involvement: this is plain DOM traversal with a fixed noise-removal
 * list, exactly like the existing docx/pdf parsers extract text
 * deterministically for Step 2.
 */
export function extractHtmlContent(html: string, baseUrl: string): ExtractedHtmlContent {
  const $ = cheerio.load(html);

  $(NOISE_SELECTORS.join(", ")).remove();

  const title = collapseWhitespace($("title").first().text()) || undefined;

  const metaDescriptionRaw =
    $('meta[name="description"]').attr("content") ?? $('meta[property="og:description"]').attr("content");
  const metaDescription = metaDescriptionRaw ? collapseWhitespace(metaDescriptionRaw) : undefined;

  const canonicalHref = $('link[rel="canonical"]').attr("href");
  const canonicalUrl = canonicalHref ? resolveUrl(canonicalHref, baseUrl) ?? undefined : undefined;

  const headings: string[] = [];
  $(HEADING_TAGS.join(", ")).each((_, el) => {
    const text = collapseWhitespace($(el).text());
    if (text) headings.push(text);
  });

  const textLines: string[] = [];
  $(TEXT_TAGS.join(", ")).each((_, el) => {
    const text = collapseWhitespace($(el).text());
    if (!text) return;

    const tagName = (el as { tagName?: string; name?: string }).tagName ?? (el as { name?: string }).name ?? "";
    const headingLevel = HEADING_TAGS.indexOf(tagName.toLowerCase());

    if (headingLevel >= 0) {
      textLines.push(`${"#".repeat(headingLevel + 1)} ${text}`);
    } else {
      textLines.push(text);
    }
  });

  const links: string[] = [];
  const seenLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !seenLinks.has(href)) {
      seenLinks.add(href);
      links.push(href);
    }
  });

  return {
    title,
    headings,
    metaDescription,
    canonicalUrl,
    links,
    text: textLines.join("\n\n"),
  };
}
