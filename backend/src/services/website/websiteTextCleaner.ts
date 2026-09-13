import { normalizeText } from "../document/textNormalizer";

/**
 * Cleans text extracted from a web page for downstream chunking.
 *
 * Reuses the existing document pipeline's normalizeText (Step 2) for the
 * generic whitespace/line-break/control-character cleanup so website text
 * and uploaded-document text are normalized identically. cheerio already
 * decodes HTML entities during text extraction, so no separate entity
 * decoding step is needed here.
 */
export function cleanWebsiteText(rawText: string): string {
  return normalizeText(rawText);
}
