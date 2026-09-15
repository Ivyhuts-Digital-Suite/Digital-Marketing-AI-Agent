import { Types } from "mongoose";
import Experiment, { ExperimentStatus, IExperiment } from "../../../models/Experiment";
import ExperimentResult, { IExperimentResult } from "../../../models/ExperimentResult";
import MarketingMetric, { MarketingMetricName } from "../../../models/MarketingMetric";
import { AnalyticsDatabaseError, InvalidAnalyticsInputError } from "../errors";
import { percentageChange } from "../engine/baselineService";

/**
 * Phase 11 - Step 15: Experimentation foundation.
 *
 * statisticallySignificant is "insufficient_data" - never a guessed true
 * or false - whenever either arm's sample size is below MIN_SAMPLE_SIZE.
 * The significance test itself is a standard two-proportion z-test,
 * appropriate for count-based metrics (clicks, leads, conversions); it is
 * a real statistical computation, not an LLM judgment call (rule #18:
 * "Claude should not do arithmetic/statistical calculations").
 */
const MIN_SAMPLE_SIZE = 30;
/** Two-tailed 95% significance threshold. */
const Z_CRITICAL = 1.96;

function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

export interface CreateExperimentInput {
  organizationId: string;
  hypothesis: string;
  control: { label: string; contentItemId?: string; description: string };
  variant: { label: string; contentItemId?: string; description: string };
  metric: string;
  startDate: Date;
  endDate?: Date;
  targetAudience?: string;
}

export async function createExperiment(input: CreateExperimentInput): Promise<IExperiment> {
  assertValidOrganizationId(input.organizationId);
  try {
    return await Experiment.create({ ...input, status: "draft" });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to create experiment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function setExperimentStatus(organizationId: string, experimentId: string, status: ExperimentStatus): Promise<IExperiment> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(experimentId)) {
    throw new InvalidAnalyticsInputError("experimentId is missing or invalid");
  }

  const experiment = await Experiment.findOne({ _id: experimentId, organizationId });
  if (!experiment) {
    throw new InvalidAnalyticsInputError(`experiment "${experimentId}" was not found`);
  }
  experiment.status = status;
  try {
    await experiment.save();
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to update experiment status: ${error instanceof Error ? error.message : String(error)}`);
  }
  return experiment;
}

async function sumMetricForContentItem(
  organizationId: string,
  metric: MarketingMetricName,
  contentItemId: string,
  from: Date,
  to: Date
): Promise<{ total: number; count: number }> {
  const rows = await MarketingMetric.aggregate<{ total: number; count: number }>([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        metric,
        contentItemId: new Types.ObjectId(contentItemId),
        periodStart: { $gte: from },
        periodEnd: { $lte: to },
      },
    },
    { $group: { _id: null, total: { $sum: "$value" }, count: { $sum: 1 } } },
  ]);
  return rows[0] ?? { total: 0, count: 0 };
}

/** Two-proportion z-test on conversion-style metrics. Returns null when a rate can't be computed (denominator missing). */
function twoProportionZTest(
  successesA: number,
  sampleA: number,
  successesB: number,
  sampleB: number
): { pValue: number; significant: boolean } | null {
  if (sampleA === 0 || sampleB === 0) return null;
  const pA = successesA / sampleA;
  const pB = successesB / sampleB;
  const pooled = (successesA + successesB) / (sampleA + sampleB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / sampleA + 1 / sampleB));
  if (se === 0) return null;
  const z = (pA - pB) / se;
  // Two-tailed p-value from the standard normal survival function approximation.
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return { pValue: Math.round(pValue * 10000) / 10000, significant: Math.abs(z) >= Z_CRITICAL };
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation (accurate to ~1.5e-7), sufficient
  // for a directional significance check - not a claim of scientific-grade precision.
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export async function computeExperimentResult(organizationId: string, experimentId: string, metric: MarketingMetricName): Promise<IExperimentResult> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(experimentId)) {
    throw new InvalidAnalyticsInputError("experimentId is missing or invalid");
  }

  const experiment = await Experiment.findOne({ _id: experimentId, organizationId });
  if (!experiment) {
    throw new InvalidAnalyticsInputError(`experiment "${experimentId}" was not found`);
  }
  if (!experiment.control.contentItemId || !experiment.variant.contentItemId) {
    throw new InvalidAnalyticsInputError("both control and variant must have a contentItemId to compute a real result");
  }

  const from = experiment.startDate;
  const to = experiment.endDate ?? new Date();

  const [control, variant] = await Promise.all([
    sumMetricForContentItem(organizationId, metric, experiment.control.contentItemId.toString(), from, to),
    sumMetricForContentItem(organizationId, metric, experiment.variant.contentItemId.toString(), from, to),
  ]);

  const hasSufficientData = control.count >= MIN_SAMPLE_SIZE && variant.count >= MIN_SAMPLE_SIZE;
  const zTest = hasSufficientData ? twoProportionZTest(control.total, control.count, variant.total, variant.count) : null;

  const changePercent = percentageChange(variant.total, control.total);
  let conclusion: string;
  let statisticallySignificant: boolean | "insufficient_data";
  let pValue: number | undefined;

  if (!hasSufficientData || !zTest) {
    statisticallySignificant = "insufficient_data";
    conclusion = `Insufficient data to test significance (control n=${control.count}, variant n=${variant.count}, minimum required is ${MIN_SAMPLE_SIZE} each).`;
  } else {
    statisticallySignificant = zTest.significant;
    pValue = zTest.pValue;
    conclusion = zTest.significant
      ? `Variant differs from control at 95% confidence (p=${zTest.pValue}).`
      : `No statistically significant difference detected (p=${zTest.pValue}).`;
  }

  let result: IExperimentResult;
  try {
    result = await ExperimentResult.create({
      organizationId,
      experimentId,
      controlValue: control.total,
      variantValue: variant.total,
      sampleSizeControl: control.count,
      sampleSizeVariant: variant.count,
      changePercent: changePercent ?? undefined,
      statisticallySignificant,
      pValue,
      conclusion,
      computedAt: new Date(),
    });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist experiment result: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}
