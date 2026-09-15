import { Types } from "mongoose";
import MarketingMetric, { MarketingMetricName } from "../../../models/MarketingMetric";
import OptimizationExecution, { IOptimizationExecution } from "../../../models/OptimizationExecution";
import OptimizationRecommendation from "../../../models/OptimizationRecommendation";
import { percentageChange } from "../engine/baselineService";
import { AnalyticsDatabaseError, InvalidAnalyticsInputError } from "../errors";

/**
 * Phase 11 - Step 14: Measurement.
 *
 * Only ever runs against an OptimizationExecution whose result is
 * "executed" (a real Phase 10 tool call reported success) - never against
 * a "requires_phase10_integration" row, since nothing actually happened to
 * measure the effect of. Compares real MarketingMetric sums before/after
 * the execution's attemptedAt timestamp for the affected entity; never
 * reports "improved" without an actual before/after comparison.
 */
function assertValidIds(organizationId: string, executionId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
  if (!executionId || !Types.ObjectId.isValid(executionId)) {
    throw new InvalidAnalyticsInputError("executionId is missing or invalid");
  }
}

async function sumMetric(
  organizationId: string,
  metric: MarketingMetricName,
  entityField: "contentItemId" | "campaignId",
  entityId: string,
  from: Date,
  to: Date
): Promise<number | null> {
  const rows = await MarketingMetric.aggregate<{ total: number; count: number }>([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        metric,
        [entityField]: new Types.ObjectId(entityId),
        periodStart: { $gte: from },
        periodEnd: { $lte: to },
      },
    },
    { $group: { _id: null, total: { $sum: "$value" }, count: { $sum: 1 } } },
  ]);
  if (!rows[0] || rows[0].count === 0) return null;
  return rows[0].total;
}

export interface MeasureOptimizationInput {
  organizationId: string;
  executionId: string;
  metrics: MarketingMetricName[];
  entityField: "contentItemId" | "campaignId";
  entityId: string;
  windowDays: number;
}

export async function measureOptimizationOutcome(input: MeasureOptimizationInput): Promise<IOptimizationExecution> {
  assertValidIds(input.organizationId, input.executionId);

  const execution = await OptimizationExecution.findOne({ _id: input.executionId, organizationId: input.organizationId });
  if (!execution) {
    throw new InvalidAnalyticsInputError(`execution "${input.executionId}" was not found`);
  }
  if (execution.result !== "executed") {
    throw new InvalidAnalyticsInputError(
      `cannot measure an execution with result "${execution.result}" - only a real "executed" outcome can be measured`
    );
  }

  const windowMs = input.windowDays * 24 * 60 * 60 * 1000;
  const beforeStart = new Date(execution.attemptedAt.getTime() - windowMs);
  const beforeEnd = execution.attemptedAt;
  const afterStart = execution.attemptedAt;
  const afterEnd = new Date(execution.attemptedAt.getTime() + windowMs);

  const measurement = [];
  for (const metric of input.metrics) {
    const [beforeValue, afterValue] = await Promise.all([
      sumMetric(input.organizationId, metric, input.entityField, input.entityId, beforeStart, beforeEnd),
      sumMetric(input.organizationId, metric, input.entityField, input.entityId, afterStart, afterEnd),
    ]);

    measurement.push({
      metric,
      beforeValue: beforeValue ?? undefined,
      afterValue: afterValue ?? undefined,
      changePercent: beforeValue !== null && afterValue !== null ? percentageChange(afterValue, beforeValue) ?? undefined : undefined,
      measuredAt: new Date(),
    });
  }

  execution.measurementWindowDays = input.windowDays;
  execution.measurement = measurement;

  try {
    await execution.save();
    await OptimizationRecommendation.updateOne(
      { _id: execution.recommendationId, organizationId: input.organizationId },
      { $set: { status: "COMPLETED" } }
    );
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist measurement: ${error instanceof Error ? error.message : String(error)}`);
  }

  return execution;
}
