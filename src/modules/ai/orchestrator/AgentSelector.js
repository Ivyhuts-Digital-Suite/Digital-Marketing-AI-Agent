import agentRegistry from "../agents/AgentRegistry.js";

/**
 * @file Agent Selection — per the roadmap's section 10.
 *
 * Decouples the orchestrator from hardcoded if/else agent dispatch by
 * routing capability lookups through the AgentRegistry instead. Callers
 * that need "the agent for this capability" go through
 * selectAgentForCapability rather than reaching into agentRegistry
 * directly, so the selection policy has one place to grow (e.g. picking
 * among multiple agents for the same capability) without touching every
 * call site.
 */

/**
 * Selects the agent registered for a given capability.
 * @param {string} capability - Capability tag, e.g. "strategy" or "content".
 * @returns {import("../types/agent.types.js").Agent} The matching agent.
 * @throws {Error} If no agent is registered for the capability.
 */
export function selectAgentForCapability(capability) {
  const agent = agentRegistry.getByCapability(capability);

  if (!agent) {
    throw new Error(`No agent registered for capability "${capability}"`);
  }

  return agent;
}
