import toolRegistry from "../../ai/tools/ToolRegistry.js";
import publishInstagramPostTool from "./publishInstagramPostTool.js";

/**
 * @file Registers all known integration tools with the shared ToolRegistry.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls toolRegistry.getByName(...); importing
 * it more than once is harmless since register() just replaces the entry.
 */

toolRegistry.register(publishInstagramPostTool);
