import { ResearchSource } from "../types/research.types";

export class SourceValidatorService {
  private trustedDomains: string[] = [
    "reuters.com",
    "bloomberg.com",
    "techcrunch.com",
    "forbes.com",
    "gartner.com",
    "statista.com",
  ];

  public validateSource(source: { url: string; title: string; snippet: string }): ResearchSource {
    let credibilityScore = 50;

    try {
      const parsedUrl = new URL(source.url);
      const isTrusted = this.trustedDomains.some((d) => parsedUrl.hostname.includes(d));

      if (isTrusted) {
        credibilityScore += 30;
      }
      if (parsedUrl.protocol === "https:") {
        credibilityScore += 10;
      }
      if (source.snippet && source.snippet.length > 50) {
        credibilityScore += 10;
      }
    } catch {
      credibilityScore = 10;
    }

    return {
      ...source,
      isValidated: credibilityScore >= 60,
      credibilityScore: Math.min(credibilityScore, 100),
    };
  }

  public filterValidSources(sources: Array<{ url: string; title: string; snippet: string }>): ResearchSource[] {
    return sources.map((s) => this.validateSource(s)).filter((s) => s.isValidated);
  }
}
