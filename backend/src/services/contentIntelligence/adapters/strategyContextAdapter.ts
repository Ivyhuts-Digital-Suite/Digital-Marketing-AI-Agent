import { StrategyContext } from "../types";

/**
 * Seam between Content Intelligence and a Strategy Agent. This branch has
 * no MarketingStrategy model yet - the Strategy Agent work lives, unmerged
 * and in a completely different module layout (plain JS under
 * `backend/src/modules/strategy/...`), on origin/preetam-strategy-agent.
 * Every Content Intelligence service depends only on this interface, so a
 * real implementation can be swapped in later (once that work is ported
 * into this branch's architecture) without changing anything downstream.
 */
export interface StrategyContextProvider {
  getActiveStrategy(organizationId: string): Promise<StrategyContext | null>;
}

/**
 * The only implementation right now: always resolves to null. Deliberately
 * simple rather than a speculative "best guess" mapping of a schema this
 * branch has never actually merged - returning null is the honest answer
 * ("no strategy exists yet"), not a fabricated one.
 */
export class NullStrategyContextProvider implements StrategyContextProvider {
  async getActiveStrategy(_organizationId: string): Promise<StrategyContext | null> {
    return null;
  }
}

export const strategyContextProvider: StrategyContextProvider = new NullStrategyContextProvider();
