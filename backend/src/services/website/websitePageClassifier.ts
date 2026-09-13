import { WebsitePageType } from "./types";

/**
 * Deterministic, rule-based page classification (Step 6). This is NOT AI
 * classification - it is fixed keyword/pattern matching against the URL
 * path, title, and headings, kept intentionally simple so a later AI
 * Analysis step can build on top of it without depending on it.
 */

interface ClassificationRule {
  type: WebsitePageType;
  patterns: RegExp[];
}

// Order matters: more specific categories are checked before broader ones
// (e.g. "case study/blog" before the generic "company" bucket).
const RULES: ClassificationRule[] = [
  { type: "PRICING", patterns: [/\bpricing\b/, /\bplans?\b/, /\bcost\b/] },
  { type: "CONTACT", patterns: [/\bcontact(-us)?\b/, /get[- ]?in[- ]?touch/, /\bsupport\b/] },
  {
    type: "CASE_STUDY",
    patterns: [/case[- ]?stud(y|ies)/, /\bcustomers?\b/, /success[- ]?stor(y|ies)/, /\bblog\b/, /\btestimonials?\b/],
  },
  { type: "PRODUCTS", patterns: [/\bproducts?\b/] },
  { type: "SERVICES", patterns: [/\bservices?\b/] },
  { type: "SOLUTIONS", patterns: [/\bsolutions?\b/, /\bindustries\b/, /\buse[- ]?cases?\b/] },
  { type: "ABOUT", patterns: [/\babout([- ]?us)?\b/, /\bteam\b/, /\bmission\b/, /\bcareers?\b/] },
  { type: "COMPANY", patterns: [/\bcompany\b/, /\borganization\b/] },
];

function safePathname(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Classifies a page into a coarse company-intelligence bucket using the
 * page's URL path, title, and headings. Returns "OTHER" when nothing
 * matches.
 */
export function classifyPage(url: string, title?: string, headings: string[] = []): WebsitePageType {
  const pathname = safePathname(url);
  const haystack = [pathname, title?.toLowerCase() ?? "", ...headings.map((h) => h.toLowerCase())].join(" ");

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.type;
    }
  }

  return "OTHER";
}
