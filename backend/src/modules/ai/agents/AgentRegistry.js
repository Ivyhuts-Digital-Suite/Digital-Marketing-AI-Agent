/**
 * @file In-memory registry of available AI agents.
 * @typedef {import("../types/agent.types.js").Agent} Agent
 */

/**
 * Holds registered agents and looks them up by name or capability.
 */
export class AgentRegistry {
  constructor() {
    /** @type {Map<string, Agent>} */
    this._agents = new Map();
  }

  /**
   * Registers an agent. Re-registering the same name replaces the entry.
   * @param {Agent} agent - Agent to register; must have `name` and `capabilities`.
   * @returns {void}
   */
  register(agent) {
    this._agents.set(agent.name, agent);
  }

  /**
   * Finds the first registered agent that advertises the given capability.
   * @param {string} capability - Capability tag, e.g. "strategy" or "content".
   * @returns {Agent|null} The matching agent, or null if none found.
   */
  getByCapability(capability) {
    for (const agent of this._agents.values()) {
      if (agent.capabilities && agent.capabilities.includes(capability)) {
        return agent;
      }
    }

    return null;
  }

  /**
   * Looks up an agent by its unique name.
   * @param {string} name - The agent name.
   * @returns {Agent|null} The matching agent, or null if not registered.
   */
  getByName(name) {
    return this._agents.get(name) || null;
  }

  /**
   * Returns every registered agent.
   * @returns {Agent[]} All registered agents, in registration order.
   */
  getAll() {
    return Array.from(this._agents.values());
  }
}

/**
 * Shared registry instance for the AI module.
 * @type {AgentRegistry}
 */
export default new AgentRegistry();
