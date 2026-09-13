import agentRegistry from "./AgentRegistry.js";
import ContentStudioAgent from "./ContentStudioAgent.js";

/**
 * @file Registers all known agents with the shared AgentRegistry.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls agentRegistry.getByCapability(...) or
 * AgentSelector.selectAgentForCapability(...); importing it more than
 * once is harmless since register() just replaces the entry.
 */

agentRegistry.register(ContentStudioAgent);
