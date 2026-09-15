import { Types } from "mongoose";
import MarketingMetric from "../../../models/MarketingMetric";
import { MarketingMetricName } from "../../../models/MarketingMetric";

/**
 * Phase 11 - Step 6: content/campaign/channel/audience performance
 * comparison. Pure aggregation over real MarketingMetric documents - ranks
 * entities against each other (peer comparison), distinct from the
 * baseline-relative comparison in anomalyDetectionService.ts.
 */
export interface PerformanceComparisonItem {
  key: string;
  totalValue: number;
  dataPointCount: number;
}

async function compareByField(
  organizationId: string,
  metric: MarketingMetricName,
  field: "contentItemId" | "campaignId" | "channel" | "audienceId",
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceComparisonItem[]> {
  const rows = await MarketingMetric.aggregate<{ _id: string | Types.ObjectId | null; totalValue: number; dataPointCount: number }>([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        metric,
        periodStart: { $gte: periodStart },
        periodEnd: { $lte: periodEnd },
        [field]: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: `$${field}`,
        totalValue: { $sum: "$value" },
        dataPointCount: { $sum: 1 },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  return rows
    .filter((row) => row._id !== null && row._id !== undefined)
    .map((row) => ({
      key: row._id!.toString(),
      totalValue: row.totalValue,
      dataPointCount: row.dataPointCount,
    }));
}

export function compareContentPerformance(organizationId: string, metric: MarketingMetricName, periodStart: Date, periodEnd: Date) {
  return compareByField(organizationId, metric, "contentItemId", periodStart, periodEnd);
}

export function compareCampaignPerformance(organizationId: string, metric: MarketingMetricName, periodStart: Date, periodEnd: Date) {
  return compareByField(organizationId, metric, "campaignId", periodStart, periodEnd);
}

export function compareChannelPerformance(organizationId: string, metric: MarketingMetricName, periodStart: Date, periodEnd: Date) {
  return compareByField(organizationId, metric, "channel", periodStart, periodEnd);
}

export function compareAudiencePerformance(organizationId: string, metric: MarketingMetricName, periodStart: Date, periodEnd: Date) {
  return compareByField(organizationId, metric, "audienceId", periodStart, periodEnd);
}

/** Dispatches to the content/campaign comparison by field name - used by callers that are generic over groupBy (e.g. the analytics engine's peer-comparison scan). */
export function compareByEntityType(
  organizationId: string,
  metric: MarketingMetricName,
  groupBy: "contentItemId" | "campaignId",
  periodStart: Date,
  periodEnd: Date
) {
  return compareByField(organizationId, metric, groupBy, periodStart, periodEnd);
}
