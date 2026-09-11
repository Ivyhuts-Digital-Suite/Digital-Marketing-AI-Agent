import AgentRun from "../../../models/mongoose/agentRun.model.js";

/**
 * @file Run Memory — read access to past AgentRun outcomes.
 *
 * This is distinct from the ambient Context built per-request (see
 * ../context/ContextBuilder.js): Context describes the world *now*
 * (company, brand), while Run Memory answers "what has this agent
 * already done", by surfacing prior runs' status and output. Per the
 * roadmap, richer memory (embeddings, learned preferences, etc.) comes
 * later — this is the basic, MVP-level history lookup.
 *
 * Both lookups are resilient by design: a memory-layer failure should
 * never crash the run that's asking for context, so failures are logged
 * and degrade to an empty result rather than throwing.
 */

const RECENT_RUN_FIELDS = "agentType request status output createdAt completedAt";

/**
 * Parameters for fetching recent runs.
 * @typedef {Object} GetRecentRunsParams
 * @property {string} organizationId - Organization to scope the lookup to.
 * @property {string} [agentType] - Optionally restrict to one agent type.
 * @property {number} [limit=5] - Maximum number of runs to return.
 */

/**
 * Fetches the most recent AgentRuns for an organization (optionally
 * filtered by agentType), newest first. Only lightweight summary fields
 * are selected — full `steps`/`toolCalls` arrays are left out on purpose.
 * @param {GetRecentRunsParams} params
 * @returns {Promise<Array<import("mongoose").Document>>} Recent runs, or an empty array on failure.
 */
export async function getRecentRuns({ organizationId, agentType, limit = 5 }) {
  try {
    const query = { organizationId };
    if (agentType) {
      query.agentType = agentType;
    }

    return await AgentRun.find(query)
      .select(RECENT_RUN_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error("getRecentRuns failed:", error);
    return [];
  }
}

/**
 * Fetches a single full AgentRun by id.
 * @param {string} runId - The AgentRun's id.
 * @returns {Promise<import("mongoose").Document|null>} The run, or null if not found or on failure.
 */
export async function getRunById(runId) {
  try {
    return await AgentRun.findById(runId);
  } catch (error) {
    console.error("getRunById failed:", error);
    return null;
  }
}
