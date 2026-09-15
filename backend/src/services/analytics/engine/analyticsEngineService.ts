import { Types } from "mongoose";
import AnalyticsFinding, {
  AffectedEntityType,
  AnalyticsFindingSeverity,
  IAnalyticsFinding,
  IAnalyticsFindingEvidenceItem,
} from "../../../models/AnalyticsFinding";
import MarketingMetric, { MarketingMetricName } from "../../../models/MarketingMetric";
import { InvalidAnalyticsInputError } from "../errors";
import { TimeSeriesPoint } from "../types";
import { detectAnomaly } from "./anomalyDetectionService";
import { computeBaseline, percentageChange } from "./baselineService";
import { compareAudiencePerformance, compareByEntityType } from "./performanceComparisonService";
import { detectTrend } from "./trendDetectionService";
import { analyzeFunnel, FunnelScope } from "../funnel/funnelAnalysisService";

/**
 * Phase 11 - Step 6/7/8: Analytics Engine.
 *
 * Turns the deterministic primitives (baseline/anomaly/trend/comparison/
 * funnel) into persisted AnalyticsFinding documents. Every field on a
 * finding is computed here from real MarketingMetric/MarketingEvent data;
 * the Analytics Agent (agents/analyticsAgentService.ts) only ever
 * interprets findings this module already produced - it cannot invent one.
 */

function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

function severityFromMagnitude(absPercent: number | null): AnalyticsFindingSeverity {
  if (absPercent === null) return "low";
  if (absPercent >= 50) return "high";
  if (absPercent >= 20) return "medium";
  return "low";
}

/** More historical periods behind a baseline = higher confidence in it. Deliberately not a function of deviation magnitude (severity already captures that). */
function confidenceFromSampleSize(sampleSize: number, fullSample = 6): number {
  return Math.round(Math.min(1, sampleSize / fullSample) * 100) / 100;
}

async function loadEntityMetricSeries(
  organizationId: string,
  metric: MarketingMetricName,
  groupBy: "contentItemId" | "campaignId",
  periods: { periodStart: Date; periodEnd: Date }[]
): Promise<Map<string, TimeSeriesPoint[]>> {
  const series = new Map<string, TimeSeriesPoint[]>();

  for (const period of periods) {
    const rows = await MarketingMetric.aggregate<{ _id: Types.ObjectId; total: number }>([
      {
        $match: {
          organizationId: new Types.ObjectId(organizationId),
          metric,
          periodStart: { $gte: period.periodStart },
          periodEnd: { $lte: period.periodEnd },
          [groupBy]: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: `$${groupBy}`, total: { $sum: "$value" } } },
    ]);

    const seenThisPeriod = new Set<string>();
    for (const row of rows) {
      const key = row._id.toString();
      seenThisPeriod.add(key);
      const existing = series.get(key) ?? [];
      existing.push({ periodStart: period.periodStart, periodEnd: period.periodEnd, value: row.total });
      series.set(key, existing);
    }
    // Entities with no data point this period get an explicit 0, so every
    // series stays aligned to `periods` - never silently shortened.
    for (const [key, points] of series.entries()) {
      if (!seenThisPeriod.has(key) && points.length < periods.indexOf(period) + 1) {
        points.push({ periodStart: period.periodStart, periodEnd: period.periodEnd, value: 0 });
      }
    }
  }

  return series;
}

function buildEvidence(items: IAnalyticsFindingEvidenceItem[]): IAnalyticsFindingEvidenceItem[] {
  return items.filter((item) => item.value === undefined || Number.isFinite(item.value));
}

/**
 * Statistical-deviation lens: flags a per-entity ANOMALY (deviation from
 * its own history) or a sustained TREND. Requires at least 4 periods
 * (3 historical + the current one) - fewer than that, nothing is reported
 * rather than guessed.
 */
export async function scanEntityAnomaliesAndTrends(
  organizationId: string,
  metric: MarketingMetricName,
  groupBy: "contentItemId" | "campaignId",
  periods: { periodStart: Date; periodEnd: Date }[]
): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);
  if (periods.length < 4) return [];

  const seriesByEntity = await loadEntityMetricSeries(organizationId, metric, groupBy, periods);
  const findings: IAnalyticsFinding[] = [];
  const currentPeriod = periods[periods.length - 1];

  for (const [entityId, series] of seriesByEntity.entries()) {
    if (series.length < periods.length) continue; // incomplete alignment - skip rather than guess

    const historical = series.slice(0, -1).map((p) => p.value);
    const current = series[series.length - 1].value;
    const anomaly = detectAnomaly(current, historical);
    const trend = detectTrend(series);

    const affectedEntity = { type: (groupBy === "contentItemId" ? "content" : "campaign") as AffectedEntityType, id: entityId, label: entityId };

    if (anomaly.isAnomaly && anomaly.hasSufficientData) {
      const evidence = buildEvidence([
        { label: "Current value", value: current },
        { label: "Baseline average", value: anomaly.baselineAverage ?? undefined },
        { label: "Expected range low", value: anomaly.expectedRangeLow ?? undefined },
        { label: "Expected range high", value: anomaly.expectedRangeHigh ?? undefined },
      ]);

      const doc = await AnalyticsFinding.create({
        organizationId,
        findingType: "ANOMALY",
        severity: severityFromMagnitude(anomaly.deviationPercent !== null ? Math.abs(anomaly.deviationPercent) : null),
        metric,
        observedValue: current,
        baselineValue: anomaly.baselineAverage ?? undefined,
        changePercent: anomaly.deviationPercent ?? undefined,
        affectedEntity,
        evidence,
        confidence: confidenceFromSampleSize(historical.length),
        detectedAt: new Date(),
        periodStart: currentPeriod.periodStart,
        periodEnd: currentPeriod.periodEnd,
      });
      findings.push(doc);
      continue;
    }

    if (trend.classification === "sustained_positive" || trend.classification === "sustained_negative") {
      const evidence = buildEvidence([
        { label: "First period value", value: series[0].value },
        { label: "Current value", value: current },
        { label: "Coefficient of variation", value: trend.coefficientOfVariation ?? undefined },
      ]);

      const doc = await AnalyticsFinding.create({
        organizationId,
        findingType: "TREND",
        severity: severityFromMagnitude(trend.totalChangePercent !== null ? Math.abs(trend.totalChangePercent) : null),
        metric,
        observedValue: current,
        baselineValue: series[0].value,
        changePercent: trend.totalChangePercent ?? undefined,
        affectedEntity,
        evidence,
        confidence: confidenceFromSampleSize(series.length),
        detectedAt: new Date(),
        periodStart: currentPeriod.periodStart,
        periodEnd: currentPeriod.periodEnd,
      });
      findings.push(doc);
    }
  }

  return findings;
}

/**
 * Peer-comparison lens: ranks entities against each other in one period
 * and flags statistical outliers as UNDERPERFORMANCE/HIGH_PERFORMANCE.
 * Requires at least 3 entities with data - fewer than that, "underperform
 * relative to whom?" has no honest answer, so nothing is reported.
 */
export async function scanPeerPerformance(
  organizationId: string,
  metric: MarketingMetricName,
  groupBy: "contentItemId" | "campaignId",
  periodStart: Date,
  periodEnd: Date
): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);

  const ranked = await compareByEntityType(organizationId, metric, groupBy, periodStart, periodEnd);
  if (ranked.length < 3) return [];

  const values = ranked.map((r) => r.totalValue);
  const baseline = computeBaseline(values, 1);
  const findings: IAnalyticsFinding[] = [];

  for (const entity of ranked) {
    const affectedEntity = { type: (groupBy === "contentItemId" ? "content" : "campaign") as AffectedEntityType, id: entity.key, label: entity.key };
    const changePercent = percentageChange(entity.totalValue, baseline.average);

    if (entity.totalValue < baseline.expectedRangeLow) {
      findings.push(
        await AnalyticsFinding.create({
          organizationId,
          findingType: "UNDERPERFORMANCE",
          severity: severityFromMagnitude(changePercent !== null ? Math.abs(changePercent) : null),
          metric,
          observedValue: entity.totalValue,
          baselineValue: baseline.average,
          changePercent: changePercent ?? undefined,
          affectedEntity,
          evidence: buildEvidence([{ label: "Peer average", value: baseline.average }, { label: "Peer count", value: ranked.length }]),
          confidence: confidenceFromSampleSize(ranked.length, 5),
          detectedAt: new Date(),
          periodStart,
          periodEnd,
        })
      );
    } else if (entity.totalValue > baseline.expectedRangeHigh) {
      findings.push(
        await AnalyticsFinding.create({
          organizationId,
          findingType: "HIGH_PERFORMANCE",
          severity: severityFromMagnitude(changePercent !== null ? Math.abs(changePercent) : null),
          metric,
          observedValue: entity.totalValue,
          baselineValue: baseline.average,
          changePercent: changePercent ?? undefined,
          affectedEntity,
          evidence: buildEvidence([{ label: "Peer average", value: baseline.average }, { label: "Peer count", value: ranked.length }]),
          confidence: confidenceFromSampleSize(ranked.length, 5),
          detectedAt: new Date(),
          periodStart,
          periodEnd,
        })
      );
    }
  }

  return findings;
}

const CONVERSION_DROP_THRESHOLD_PERCENT = 30;

/** Flags a stage whose conversion rate dropped sharply between two periods, even while upstream volume held or grew. */
export async function scanConversionProblems(
  organizationId: string,
  currentScope: FunnelScope,
  previousScope: FunnelScope
): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);

  const [current, previous] = await Promise.all([analyzeFunnel(currentScope), analyzeFunnel(previousScope)]);
  const findings: IAnalyticsFinding[] = [];

  for (let i = 0; i < current.transitions.length; i++) {
    const currentTransition = current.transitions[i];
    const previousTransition = previous.transitions[i];
    if (currentTransition.conversionRate === null || previousTransition.conversionRate === null) continue;
    if (previousTransition.conversionRate === 0) continue;

    const relativeChange =
      ((currentTransition.conversionRate - previousTransition.conversionRate) / previousTransition.conversionRate) * 100;

    if (relativeChange <= -CONVERSION_DROP_THRESHOLD_PERCENT) {
      findings.push(
        await AnalyticsFinding.create({
          organizationId,
          findingType: "CONVERSION_PROBLEM",
          severity: severityFromMagnitude(Math.abs(relativeChange)),
          metric: `conversionRate:${currentTransition.from}->${currentTransition.to}`,
          observedValue: currentTransition.conversionRate,
          baselineValue: previousTransition.conversionRate,
          changePercent: Math.round(relativeChange * 100) / 100,
          affectedEntity: {
            type: (currentScope.contentItemId ? "content" : currentScope.campaignId ? "campaign" : "channel") as AffectedEntityType,
            id: currentScope.contentItemId ?? currentScope.campaignId,
            label: `${currentTransition.from} -> ${currentTransition.to} conversion`,
          },
          evidence: buildEvidence([
            { label: `${currentTransition.from} count (current)`, value: current.counts[currentTransition.from] },
            { label: `${currentTransition.to} count (current)`, value: current.counts[currentTransition.to] },
          ]),
          confidence: confidenceFromSampleSize(current.counts[currentTransition.from], 20),
          detectedAt: new Date(),
          periodStart: currentScope.periodStart,
          periodEnd: currentScope.periodEnd,
        })
      );
    }
  }

  return findings;
}

const AUDIENCE_SHARE_SHIFT_THRESHOLD_POINTS = 20;

/** Flags a meaningful shift in which audience segment drives a metric, between two periods. */
export async function scanAudienceChanges(
  organizationId: string,
  metric: MarketingMetricName,
  currentPeriod: { periodStart: Date; periodEnd: Date },
  previousPeriod: { periodStart: Date; periodEnd: Date }
): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);

  const [current, previous] = await Promise.all([
    compareAudiencePerformance(organizationId, metric, currentPeriod.periodStart, currentPeriod.periodEnd),
    compareAudiencePerformance(organizationId, metric, previousPeriod.periodStart, previousPeriod.periodEnd),
  ]);

  if (current.length === 0 || previous.length === 0) return [];

  const currentTotal = current.reduce((sum, a) => sum + a.totalValue, 0);
  const previousTotal = previous.reduce((sum, a) => sum + a.totalValue, 0);
  if (currentTotal === 0 || previousTotal === 0) return [];

  const previousShareByKey = new Map(previous.map((a) => [a.key, (a.totalValue / previousTotal) * 100]));
  const findings: IAnalyticsFinding[] = [];

  for (const audience of current) {
    const currentShare = (audience.totalValue / currentTotal) * 100;
    const previousShare = previousShareByKey.get(audience.key) ?? 0;
    const shiftPoints = currentShare - previousShare;

    if (Math.abs(shiftPoints) >= AUDIENCE_SHARE_SHIFT_THRESHOLD_POINTS) {
      findings.push(
        await AnalyticsFinding.create({
          organizationId,
          findingType: "AUDIENCE_CHANGE",
          severity: severityFromMagnitude(Math.abs(shiftPoints)),
          metric,
          observedValue: Math.round(currentShare * 100) / 100,
          baselineValue: Math.round(previousShare * 100) / 100,
          changePercent: Math.round(shiftPoints * 100) / 100,
          affectedEntity: { type: "audience", id: audience.key, label: audience.key },
          evidence: buildEvidence([
            { label: "Current share", value: Math.round(currentShare * 100) / 100, unit: "%" },
            { label: "Previous share", value: Math.round(previousShare * 100) / 100, unit: "%" },
          ]),
          confidence: confidenceFromSampleSize(current.length, 5),
          detectedAt: new Date(),
          periodStart: currentPeriod.periodStart,
          periodEnd: currentPeriod.periodEnd,
        })
      );
    }
  }

  return findings;
}
