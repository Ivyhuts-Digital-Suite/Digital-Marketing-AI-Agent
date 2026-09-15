import { Types } from "mongoose";
import MarketingEvent, { MarketingEventType } from "../../../models/MarketingEvent";
import MarketingMetric from "../../../models/MarketingMetric";
import { percentageChange } from "../engine/baselineService";

/**
 * Phase 11 - Step 5: Funnel Normalization.
 *
 * Every calculation here is deterministic and returns null/undefined
 * (never a fabricated number) whenever the data needed for it doesn't
 * exist - e.g. costPerLead is null when there is no "spend" metric or no
 * LEAD events for the scope, rather than silently treating a missing
 * value as zero.
 */
const FUNNEL_STAGES: MarketingEventType[] = [
  "IMPRESSION",
  "ENGAGEMENT",
  "CLICK",
  "LEAD",
  "MQL",
  "SQL",
  "OPPORTUNITY",
  "CUSTOMER",
  "REVENUE",
];

export interface FunnelScope {
  organizationId: string;
  campaignId?: string;
  contentItemId?: string;
  periodStart: Date;
  periodEnd: Date;
}

export type FunnelStageCounts = Record<MarketingEventType, number>;

export interface FunnelStageTransition {
  from: MarketingEventType;
  to: MarketingEventType;
  conversionRate: number | null;
  dropOffRate: number | null;
}

export interface FunnelAnalysisResult {
  counts: FunnelStageCounts;
  totalRevenueValue: number | null;
  transitions: FunnelStageTransition[];
  totalSpend: number | null;
  costPerLead: number | null;
  costPerMql: number | null;
  costPerSql: number | null;
  customerAcquisitionCost: number | null;
  roi: number | null;
  roas: number | null;
}

function buildEventMatch(scope: FunnelScope): Record<string, unknown> {
  const match: Record<string, unknown> = {
    organizationId: new Types.ObjectId(scope.organizationId),
    timestamp: { $gte: scope.periodStart, $lte: scope.periodEnd },
  };
  if (scope.campaignId) match.campaignId = new Types.ObjectId(scope.campaignId);
  if (scope.contentItemId) match.contentItemId = new Types.ObjectId(scope.contentItemId);
  return match;
}

async function getStageCounts(scope: FunnelScope): Promise<FunnelStageCounts> {
  const rows = await MarketingEvent.aggregate<{ _id: MarketingEventType; count: number }>([
    { $match: buildEventMatch(scope) },
    { $group: { _id: "$eventType", count: { $sum: 1 } } },
  ]);

  const counts = Object.fromEntries(FUNNEL_STAGES.map((stage) => [stage, 0])) as FunnelStageCounts;
  for (const row of rows) {
    counts[row._id] = row.count;
  }
  return counts;
}

async function getTotalRevenueValue(scope: FunnelScope): Promise<number | null> {
  const rows = await MarketingEvent.aggregate<{ total: number; count: number }>([
    { $match: { ...buildEventMatch(scope), eventType: "REVENUE", value: { $exists: true, $ne: null } } },
    { $group: { _id: null, total: { $sum: "$value" }, count: { $sum: 1 } } },
  ]);
  if (!rows[0] || rows[0].count === 0) return null;
  return rows[0].total;
}

async function getTotalSpend(scope: FunnelScope): Promise<number | null> {
  const match: Record<string, unknown> = {
    organizationId: new Types.ObjectId(scope.organizationId),
    metric: "spend",
    periodStart: { $gte: scope.periodStart },
    periodEnd: { $lte: scope.periodEnd },
  };
  if (scope.campaignId) match.campaignId = new Types.ObjectId(scope.campaignId);
  if (scope.contentItemId) match.contentItemId = new Types.ObjectId(scope.contentItemId);

  const rows = await MarketingMetric.aggregate<{ total: number; count: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$value" }, count: { $sum: 1 } } },
  ]);
  if (!rows[0] || rows[0].count === 0) return null;
  return rows[0].total;
}

function safeDivide(numerator: number | null, denominator: number | null | undefined): number | null {
  if (numerator === null || !denominator) return null;
  return Math.round((numerator / denominator) * 100) / 100;
}

export async function analyzeFunnel(scope: FunnelScope): Promise<FunnelAnalysisResult> {
  const [counts, totalRevenueValue, totalSpend] = await Promise.all([
    getStageCounts(scope),
    getTotalRevenueValue(scope),
    getTotalSpend(scope),
  ]);

  const transitions: FunnelStageTransition[] = [];
  for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
    const from = FUNNEL_STAGES[i];
    const to = FUNNEL_STAGES[i + 1];
    const fromCount = counts[from];
    const toCount = counts[to];
    const conversionRate = fromCount > 0 ? Math.round((toCount / fromCount) * 10000) / 100 : null;
    const dropOffRate = conversionRate !== null ? Math.round((100 - conversionRate) * 100) / 100 : null;
    transitions.push({ from, to, conversionRate, dropOffRate });
  }

  const costPerLead = safeDivide(totalSpend, counts.LEAD);
  const costPerMql = safeDivide(totalSpend, counts.MQL);
  const costPerSql = safeDivide(totalSpend, counts.SQL);
  const customerAcquisitionCost = safeDivide(totalSpend, counts.CUSTOMER);

  const roi =
    totalRevenueValue !== null && totalSpend
      ? Math.round(((totalRevenueValue - totalSpend) / totalSpend) * 10000) / 100
      : null;
  const roas = totalRevenueValue !== null && totalSpend ? Math.round((totalRevenueValue / totalSpend) * 100) / 100 : null;

  return {
    counts,
    totalRevenueValue,
    transitions,
    totalSpend,
    costPerLead,
    costPerMql,
    costPerSql,
    customerAcquisitionCost,
    roi,
    roas,
  };
}

/** Growth rate between two funnel scopes covering different periods - null when the earlier period had zero of that stage. */
export async function computeFunnelGrowth(
  currentScope: FunnelScope,
  previousScope: FunnelScope
): Promise<Partial<Record<MarketingEventType, number | null>>> {
  const [current, previous] = await Promise.all([getStageCounts(currentScope), getStageCounts(previousScope)]);
  const growth: Partial<Record<MarketingEventType, number | null>> = {};
  for (const stage of FUNNEL_STAGES) {
    growth[stage] = percentageChange(current[stage], previous[stage]);
  }
  return growth;
}
