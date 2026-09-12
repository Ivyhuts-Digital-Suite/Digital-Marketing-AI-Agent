/**
 * Basic, non-semantic text cleanup applied uniformly after any parser runs.
 * No chunking, no summarization, no LLM involvement.
 */
export function normalizeText(raw: string | undefined | null): string {
  if (!raw) {
    return "";
  }

  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Strip null/control characters but keep newline (\n) and tab (\t).
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  // Collapse repeated horizontal whitespace.
  text = text.replace(/[ \t]+/g, " ");

  // Trim trailing whitespace on each line.
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Collapse 3+ blank lines down to a single paragraph break.
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
