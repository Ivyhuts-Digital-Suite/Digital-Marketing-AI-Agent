import toolRegistry from "../../ai/tools/ToolRegistry.js";
import publishInstagramPostTool from "./publishInstagramPostTool.js";
import publishInstagramCarouselTool from "./publishInstagramCarouselTool.js";
import publishInstagramReelTool from "./publishInstagramReelTool.js";
import getInstagramProfileTool from "./getInstagramProfileTool.js";
import getInstagramContentMetricsTool from "./getInstagramContentMetricsTool.js";
import scheduleInstagramContentTool from "./scheduleInstagramContentTool.js";

/**
 * @file Registers all known integration tools with the shared ToolRegistry.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls toolRegistry.getByName(...); importing
 * it more than once is harmless since register() just replaces the entry.
 */

toolRegistry.register(publishInstagramPostTool);
toolRegistry.register(publishInstagramCarouselTool);
toolRegistry.register(publishInstagramReelTool);
toolRegistry.register(getInstagramProfileTool);
toolRegistry.register(getInstagramContentMetricsTool);
toolRegistry.register(scheduleInstagramContentTool);
