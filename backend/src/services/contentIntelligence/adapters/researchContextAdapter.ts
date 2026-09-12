import { ResearchContext } from "../types";

/**
 * Seam between Content Intelligence and a Research Agent. This branch has
 * no ResearchReport model yet - the Research Agent work lives, unmerged
 * and in a completely different module layout (`src/modules/research/...`,
 * outside `backend/` entirely), on origin/preetam-research-agent. Every
 * Content Intelligence service depends only on this interface, so a real
 * implementation can be swapped in later without changing anything
 * downstream.
 */
export interface ResearchContextProvider {
  getResearchContext(organizationId: string): Promise<ResearchContext | null>;
}

/**
 * The only implementation right now: always resolves to null rather than
 * fabricating market/competitor/keyword/trend insights that were never
 * actually researched.
 */
export class NullResearchContextProvider implements ResearchContextProvider {
  async getResearchContext(_organizationId: string): Promise<ResearchContext | null> {
    return null;
  }
}

export const researchContextProvider: ResearchContextProvider = new NullResearchContextProvider();
