import toolRegistry from "../../ai/tools/ToolRegistry.js";
import publishInstagramPostTool from "./publishInstagramPostTool.js";
import publishInstagramCarouselTool from "./publishInstagramCarouselTool.js";
import publishInstagramReelTool from "./publishInstagramReelTool.js";
import getInstagramProfileTool from "./getInstagramProfileTool.js";
import getInstagramContentMetricsTool from "./getInstagramContentMetricsTool.js";
import scheduleInstagramContentTool from "./scheduleInstagramContentTool.js";
import getGoogleCampaignInsightsTool from "./getGoogleCampaignInsightsTool.js";
import getGoogleKeywordPerformanceTool from "./getGoogleKeywordPerformanceTool.js";
import getGoogleAdPerformanceTool from "./getGoogleAdPerformanceTool.js";
import getGoogleBudgetInsightsTool from "./getGoogleBudgetInsightsTool.js";
import createEmailCampaignTool from "./createEmailCampaignTool.js";
import segmentEmailAudienceTool from "./segmentEmailAudienceTool.js";
import getEmailCampaignMetricsTool from "./getEmailCampaignMetricsTool.js";
import getEmailPerformanceTool from "./getEmailPerformanceTool.js";
import getLeadsTool from "./getLeadsTool.js";
import getContactsTool from "./getContactsTool.js";
import getPipelineTool from "./getPipelineTool.js";
import getRevenueTool from "./getRevenueTool.js";

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
toolRegistry.register(getGoogleCampaignInsightsTool);
toolRegistry.register(getGoogleKeywordPerformanceTool);
toolRegistry.register(getGoogleAdPerformanceTool);
toolRegistry.register(getGoogleBudgetInsightsTool);
toolRegistry.register(createEmailCampaignTool);
toolRegistry.register(segmentEmailAudienceTool);
toolRegistry.register(getEmailCampaignMetricsTool);
toolRegistry.register(getEmailPerformanceTool);
toolRegistry.register(getLeadsTool);
toolRegistry.register(getContactsTool);
toolRegistry.register(getPipelineTool);
toolRegistry.register(getRevenueTool);
