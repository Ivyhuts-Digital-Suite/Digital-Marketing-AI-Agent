/**
 * Seam between Optimization execution and the Phase 10 integration/tool
 * layer. Phase 10 does not exist in this codebase yet, so the only
 * implementation here honestly reports that every tool "requires Phase 10
 * integration" rather than pretending to execute anything. Once Phase 10
 * exists, only this file changes - executionService.ts (Step 13) depends
 * solely on the MarketingIntegrationProvider interface.
 */
export interface MarketingIntegrationExecutionResult {
  available: boolean;
  message: string;
}

export interface MarketingIntegrationProvider {
  /** Whether a given Phase 10 tool (e.g. "publish_instagram_post") is currently available to call. */
  isToolAvailable(toolName: string): Promise<boolean>;
  /** Attempts to execute a named tool. Never fabricates success - reports available:false when the tool doesn't exist yet. */
  executeTool(toolName: string, input: Record<string, unknown>): Promise<MarketingIntegrationExecutionResult>;
}

export class NullMarketingIntegrationProvider implements MarketingIntegrationProvider {
  async isToolAvailable(_toolName: string): Promise<boolean> {
    return false;
  }

  async executeTool(toolName: string, _input: Record<string, unknown>): Promise<MarketingIntegrationExecutionResult> {
    return {
      available: false,
      message: `Tool "${toolName}" requires the Phase 10 integration layer, which is not yet implemented in this codebase.`,
    };
  }
}

export const marketingIntegrationProvider: MarketingIntegrationProvider = new NullMarketingIntegrationProvider();
