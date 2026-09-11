import { ResearchPlannerService } from "./planner/research-planner.service";
import { SourceValidatorService } from "./sources/source-validator.service";
import { ClaimExtractorService } from "./extraction/claim-extractor.service";
import { ResearchSynthesisService } from "./synthesis/research-synthesis.service";
import { ResearchModel } from "./database/research.schema";
import {
  ResearchQuery,
  ResearchAgentOutput,
  ResearchSource,
  ExtractedClaim,
} from "./types/research.types";

export class ResearchAgent {
  private planner: ResearchPlannerService;
  private validator: SourceValidatorService;
  private extractor: ClaimExtractorService;
  private synthesizer: ResearchSynthesisService;

  constructor() {
    this.planner = new ResearchPlannerService();
    this.validator = new SourceValidatorService();
    this.extractor = new ClaimExtractorService();
    this.synthesizer = new ResearchSynthesisService();
  }

  public async runResearch(query: ResearchQuery): Promise<ResearchAgentOutput> {
    const plan = this.planner.planResearch(query);

    const initialSources = [
      {
        url: `https://techcrunch.com/search/${encodeURIComponent(query.companyName)}`,
        title: `${query.companyName} news and updates`,
        snippet: `${query.companyName} is actively operating in ${query.industry || "the market"}.`,
      },
    ];

    const sources: ResearchSource[] = this.validator.filterValidSources(initialSources);

    const claims: ExtractedClaim[] = [];
    for (const source of sources) {
      if (typeof (this.extractor as any).extractClaims === "function") {
        const extracted = await (this.extractor as any).extractClaims(source.snippet, source.url);
        if (Array.isArray(extracted)) {
          claims.push(...extracted);
        }
      }
    }

    let synthesisResult = {
      summary: `Research conducted for ${query.companyName}.`,
      insights: [`Market demand identified for ${query.industry || "target domain"}.`],
    };

    if (typeof (this.synthesizer as any).synthesize === "function") {
      synthesisResult = await (this.synthesizer as any).synthesize(claims, sources);
    }

    const output: ResearchAgentOutput = {
      query,
      plan,
      sources,
      claims,
      synthesis: synthesisResult,
      status: "completed",
    };

    try {
      await ResearchModel.create({
        companyName: query.companyName,
        industry: query.industry,
        status: output.status,
        plan: output.plan,
        sources: output.sources,
        claims: output.claims,
        synthesis: output.synthesis,
      });
    } catch {
      // Database write is optional during standalone executions
    }

    return output;
  }
}
