import { Types } from "mongoose";
import AnalyticsFinding, { IAnalyticsFinding } from "../../models/AnalyticsFinding";
import MarketingMetric, { IMarketingMetric, MarketingMetricName } from "../../models/MarketingMetric";
import { AnalyticsDatabaseError, FindingNotFoundError, InvalidAnalyticsInputError } from "./errors";
import { analyzeFunnel, FunnelAnalysisResult } from "./funnel/funnelAnalysisService";

/**
 * Phase 11 - Step 18: top-level Analytics facade consumed by
 * analytics.controller.ts. Every method validates organizationId at the
 * boundary and scopes every query by it, mirroring the same pattern
 * already used by companyIntelligenceService/contentIntelligenceService.
 */
function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

export interface AnalyticsOverview {
  periodStart: Date;
  periodEnd: Date;
  funnel: FunnelAnalysisResult;
}

export async function getOverview(organizationId: string, periodStart: Date, periodEnd: Date): Promise<AnalyticsOverview> {
  assertValidOrganizationId(organizationId);
  const funnel = await analyzeFunnel({ organizationId, periodStart, periodEnd });
  return { periodStart, periodEnd, funnel };
}

export interface MetricsQuery {
  metric?: MarketingMetricName;
  periodStart?: Date;
  periodEnd?: Date;
  contentItemId?: string;
  campaignId?: string;
}

export async function getMetrics(organizationId: string, query: MetricsQuery): Promise<IMarketingMetric[]> {
  assertValidOrganizationId(organizationId);

  const filter: Record<string, unknown> = { organizationId };
  if (query.metric) filter.metric = query.metric;
  if (query.periodStart) filter.periodStart = { $gte: query.periodStart };
  if (query.periodEnd) filter.periodEnd = { ...(filter.periodEnd as object), $lte: query.periodEnd };
  if (query.contentItemId) {
    if (!Types.ObjectId.isValid(query.contentItemId)) throw new InvalidAnalyticsInputError("contentItemId is invalid");
    filter.contentItemId = query.contentItemId;
  }
  if (query.campaignId) {
    if (!Types.ObjectId.isValid(query.campaignId)) throw new InvalidAnalyticsInputError("campaignId is invalid");
    filter.campaignId = query.campaignId;
  }

  try {
    return await MarketingMetric.find(filter).sort({ periodStart: -1 }).limit(1000);
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load metrics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function listFindings(organizationId: string): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);
  try {
    return await AnalyticsFinding.find({ organizationId }).sort({ detectedAt: -1 }).limit(200);
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to list findings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getFinding(organizationId: string, findingId: string): Promise<IAnalyticsFinding> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(findingId)) {
    throw new InvalidAnalyticsInputError("findingId is missing or invalid");
  }

  let finding: IAnalyticsFinding | null;
  try {
    finding = await AnalyticsFinding.findOne({ _id: findingId, organizationId });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load finding: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!finding) throw new FindingNotFoundError(findingId);
  return finding;
}
