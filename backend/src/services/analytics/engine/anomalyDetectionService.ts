/**
 * Phase 11 - Step 7: Anomaly Detection.
 *
 * Deterministic only. An LLM is never asked "is 7,900 abnormal?" - this
 * function answers that, and only a confirmed AnalyticsFinding (built from
 * this result) is ever handed to the Analytics Agent for interpretation.
 */
import { computeBaseline, percentageChange } from "./baselineService";

export interface AnomalyCheckResult {
  /** false whenever there isn't enough history to judge - never guessed. */
  isAnomaly: boolean;
  hasSufficientData: boolean;
  currentValue: number;
  baselineAverage: number | null;
  expectedRangeLow: number | null;
  expectedRangeHigh: number | null;
  deviationPercent: number | null;
  direction: "above" | "below" | null;
}

const MIN_HISTORICAL_SAMPLES = 3;

export function detectAnomaly(
  currentValue: number,
  historicalValues: number[],
  stdDevMultiplier = 1.5
): AnomalyCheckResult {
  if (historicalValues.length < MIN_HISTORICAL_SAMPLES) {
    return {
      isAnomaly: false,
      hasSufficientData: false,
      currentValue,
      baselineAverage: null,
      expectedRangeLow: null,
      expectedRangeHigh: null,
      deviationPercent: null,
      direction: null,
    };
  }

  const baseline = computeBaseline(historicalValues, stdDevMultiplier);
  const isAnomaly = currentValue < baseline.expectedRangeLow || currentValue > baseline.expectedRangeHigh;

  return {
    isAnomaly,
    hasSufficientData: true,
    currentValue,
    baselineAverage: baseline.average,
    expectedRangeLow: baseline.expectedRangeLow,
    expectedRangeHigh: baseline.expectedRangeHigh,
    deviationPercent: percentageChange(currentValue, baseline.average),
    direction: isAnomaly ? (currentValue > baseline.expectedRangeHigh ? "above" : "below") : null,
  };
}
