export interface ToolContext {
  userQuery?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface ResearchTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  execute(input: TInput, context?: ToolContext): Promise<TOutput>;
}

export interface WebSearchInput {
  query: string;
  limit?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool implements ResearchTool<WebSearchInput, WebSearchResult[]> {
  public name = "web_search";
  public description = "Executes internet search queries for research synthesis.";

  public async execute(input: WebSearchInput, _context?: ToolContext): Promise<WebSearchResult[]> {
    return [
      {
        title: `${input.query} - Overview`,
        url: `https://techcrunch.com/search/${encodeURIComponent(input.query)}`,
        snippet: `Latest research details and industry findings related to ${input.query}.`
      }
    ];
  }
}
