/**
 * Phase 11 - Step 8: Trend Detection.
 *
 * Distinguishes a sustained trend from an anomaly/noise, deterministically.
 * Seasonal-change detection is NOT implemented - it needs more historical
 * periods than this system can assume exist yet; classifying something as
 * "seasonal" without real year-over-year history would be a guess, so this
 * only ever returns the classifications below (see docs/analytics for the
 * explicit NOT YET IMPLEMENTED note on seasonality).
 */
import { TimeSeriesPoint } from "../types";

export type TrendClassification = "sustained_positive" | "sustained_negative" | "volatile" | "stable" | "insufficient_data";

const MIN_SAMPLES = 3;
/** Minimum total change (percent) across the series to call it a sustained trend rather than noise. */
const SUSTAINED_CHANGE_THRESHOLD_PERCENT = 10;
/** Coefficient of variation above which a stable-looking series is instead classified volatile. */
const VOLATILITY_CV_THRESHOLD = 0.3;

export interface TrendResult {
  classification: TrendClassification;
  totalChangePercent: number | null;
  coefficientOfVariation: number | null;
}

export function detectTrend(series: TimeSeriesPoint[]): TrendResult {
  const values = series.map((p) => p.value);

  if (values.length < MIN_SAMPLES) {
    return { classification: "insufficient_data", totalChangePercent: null, coefficientOfVariation: null };
  }

  let nonDecreasing = true;
  let nonIncreasing = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) nonDecreasing = false;
    if (values[i] > values[i - 1]) nonIncreasing = false;
  }

  const first = values[0];
  const last = values[values.length - 1];
  const totalChangePercent = first !== 0 ? Math.round(((last - first) / first) * 10000) / 100 : null;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean !== 0 ? stdDev / mean : 0;

  if (nonDecreasing && totalChangePercent !== null && totalChangePercent >= SUSTAINED_CHANGE_THRESHOLD_PERCENT) {
    return { classification: "sustained_positive", totalChangePercent, coefficientOfVariation };
  }
  if (nonIncreasing && totalChangePercent !== null && totalChangePercent <= -SUSTAINED_CHANGE_THRESHOLD_PERCENT) {
    return { classification: "sustained_negative", totalChangePercent, coefficientOfVariation };
  }
  if (coefficientOfVariation > VOLATILITY_CV_THRESHOLD) {
    return { classification: "volatile", totalChangePercent, coefficientOfVariation };
  }
  return { classification: "stable", totalChangePercent, coefficientOfVariation };
}
