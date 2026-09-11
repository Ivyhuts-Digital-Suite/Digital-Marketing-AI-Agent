import { ResearchPlan, ResearchQuery } from "../types/research.types";

export class ResearchPlannerService {
  public planResearch(query: ResearchQuery): ResearchPlan {
    const searchQueries: string[] = [
      `${query.companyName} company overview products services`,
      `${query.companyName} market share industry analysis`,
    ];

    if (query.industry) {
      searchQueries.push(`${query.industry} latest trends market outlook`);
    }

    if (query.competitors && query.competitors.length > 0) {
      query.competitors.forEach((competitor) => {
        searchQueries.push(`${query.companyName} vs ${competitor} comparison`);
      });
    }

    const steps = [
      "Gather company profile and product offerings",
      "Identify key competitors and market positioning",
      "Analyze market trends and keyword opportunities",
      "Validate extracted sources and claims",
      "Synthesize final strategic marketing insights",
    ];

    const targetDomains = [
      "linkedin.com",
      "crunchbase.com",
      "techcrunch.com",
      "g2.com",
      "similarweb.com",
    ];

    return {
      steps,
      targetDomains,
      searchQueries,
    };
  }
}
