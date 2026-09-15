/**
 * Phase 11 - Step 6: Analytics Engine (baseline / comparison primitives).
 *
 * Pure arithmetic - no LLM, no database access. This is exactly the code
 * the spec means by "your backend should calculate 12,430 / 31,200, not
 * Claude".
 */
import { TimeSeriesPoint } from "../types";

export interface BaselineResult {
  average: number;
  stdDev: number;
  expectedRangeLow: number;
  expectedRangeHigh: number;
  sampleSize: number;
}

export function computeBaseline(values: number[], stdDevMultiplier = 1.5): BaselineResult {
  const sampleSize = values.length;
  const average = sampleSize > 0 ? values.reduce((sum, v) => sum + v, 0) / sampleSize : 0;
  const variance =
    sampleSize > 0 ? values.reduce((sum, v) => sum + (v - average) ** 2, 0) / sampleSize : 0;
  const stdDev = Math.sqrt(variance);

  return {
    average,
    stdDev,
    expectedRangeLow: average - stdDevMultiplier * stdDev,
    expectedRangeHigh: average + stdDevMultiplier * stdDev,
    sampleSize,
  };
}

/** Null when baseline is 0 - a percentage change against zero is undefined, never reported as a number. */
export function percentageChange(current: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return Math.round(((current - baseline) / baseline) * 10000) / 100;
}

export function movingAverage(series: TimeSeriesPoint[], windowSize: number): (number | null)[] {
  if (windowSize <= 0) return series.map(() => null);
  return series.map((_, index) => {
    if (index + 1 < windowSize) return null;
    const window = series.slice(index + 1 - windowSize, index + 1);
    return window.reduce((sum, p) => sum + p.value, 0) / windowSize;
  });
}
