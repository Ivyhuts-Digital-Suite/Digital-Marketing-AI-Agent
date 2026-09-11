/**
 * @file In-memory registry of tools an agent can invoke.
 * @typedef {import("../types/tool.types.js").Tool} Tool
 */

/**
 * Holds registered tools and looks them up by name.
 */
export class ToolRegistry {
  constructor() {
    /** @type {Map<string, Tool>} */
    this._tools = new Map();
  }

  /**
   * Registers a tool. Re-registering the same name replaces the entry.
   * @param {Tool} tool - Tool to register; must have `name`, `description`, `execute`.
   * @returns {void}
   */
  register(tool) {
    this._tools.set(tool.name, tool);
  }

  /**
   * Looks up a tool by its unique name.
   * @param {string} name - The tool name.
   * @returns {Tool|null} The matching tool, or null if not registered.
   */
  getByName(name) {
    return this._tools.get(name) || null;
  }

  /**
   * Returns every registered tool.
   * @returns {Tool[]} All registered tools, in registration order.
   */
  getAll() {
    return Array.from(this._tools.values());
  }
}

/**
 * Shared registry instance for the AI module.
 * @type {ToolRegistry}
 */
export default new ToolRegistry();
