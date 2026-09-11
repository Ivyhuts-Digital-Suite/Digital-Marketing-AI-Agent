import AgentRun from "../../../../models/agentRun.model.js";

/**
 * @file Conversation Memory (Short-Term Memory) — per-conversation run history.
 *
 * Per the roadmap's Memory System section, this is distinct from:
 *   - Run Memory (see ./RunMemory.js), which looks up recent runs broadly
 *     by organization/agentType, with no notion of a conversation thread.
 *   - Context (see ../context/ContextBuilder.js), which describes the
 *     world *now* (company, brand) rather than what was said before.
 *
 * Conversation Memory answers "what happened earlier in this specific
 * conversation", so a run can be given its own prior turns as context.
 *
 * Note: `conversationId` currently lives inside AgentRun's free-form,
 * unindexed `context` field rather than as a dedicated schema field, so
 * this queries the "context.conversationId" dot-path against that Mixed
 * field. A future schema migration could promote conversationId to a
 * proper top-level indexed field for better query performance.
 */

/**
 * Parameters for fetching a conversation's history.
 * @typedef {Object} GetConversationHistoryParams
 * @property {string} organizationId - Organization to scope the lookup to.
 * @property {string} [conversationId] - The conversation to fetch turns for.
 * @property {number} [limit=10] - Maximum number of turns to return.
 */

/**
 * A single turn in a conversation's history.
 * @typedef {Object} ConversationTurn
 * @property {string} request - The request message for that run.
 * @property {*} output - That run's output.
 * @property {Date} createdAt - When that run was created.
 */

/**
 * Fetches a conversation's prior turns, oldest first, so it reads in
 * chronological order.
 * @param {GetConversationHistoryParams} params
 * @returns {Promise<ConversationTurn[]>} The conversation's turns, or an empty array if there's none or on failure.
 */
export async function getConversationHistory({
  organizationId,
  conversationId,
  limit = 10
}) {
  if (!conversationId) {
    return [];
  }

  try {
    const runs = await AgentRun.find({
      organizationId,
      "context.conversationId": conversationId
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    return runs.map((run) => ({
      request: run.request,
      output: run.output,
      createdAt: run.createdAt
    }));
  } catch (error) {
    console.error("getConversationHistory failed:", error);
    return [];
  }
}
