/**
 * @file StatisticalEvaluationService — a deterministic statistics engine.
 *
 * No LLM calls anywhere in this file, per the roadmap's explicit
 * principle: raw data → statistical engine → result → LLM
 * interpretation, never raw data → LLM → winner. Every number here is
 * computed by a fixed, well-known formula (a two-proportion z-test and
 * the Abramowitz-Stegun normal CDF approximation) — nothing here asks a
 * model to judge significance or a winner.
 */

/**
 * Standard normal cumulative distribution function, via the
 * Abramowitz-Stegun approximation.
 * @param {number} z
 * @returns {number}
 */
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) prob = 1 - prob;
  return prob;
}

/**
 * Maps a confidence level to its two-tailed z-score threshold.
 * @param {number} confidenceLevel
 * @returns {number}
 */
function zThresholdFor(confidenceLevel) {
  if (confidenceLevel === 0.9) return 1.645;
  if (confidenceLevel === 0.95) return 1.96;
  if (confidenceLevel === 0.99) return 2.576;
  return 1.96;
}

/**
 * Runs a two-proportion z-test comparing a control and variant
 * conversion rate.
 * @param {Object} params
 * @param {number} params.controlConversions
 * @param {number} params.controlSampleSize
 * @param {number} params.variantConversions
 * @param {number} params.variantSampleSize
 * @param {number} [params.confidenceLevel=0.95]
 * @returns {Object} The statistical result, or { valid: false, error } on invalid input.
 */
export function calculateSignificance({
  controlConversions,
  controlSampleSize,
  variantConversions,
  variantSampleSize,
  confidenceLevel = 0.95
}) {
  if (controlSampleSize <= 0 || variantSampleSize <= 0) {
    return { valid: false, error: "INVALID_SAMPLE_SIZE" };
  }

  const controlRate = controlConversions / controlSampleSize;
  const variantRate = variantConversions / variantSampleSize;

  const pooledRate =
    (controlConversions + variantConversions) /
    (controlSampleSize + variantSampleSize);

  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlSampleSize + 1 / variantSampleSize)
  );

  if (standardError === 0) {
    return { valid: false, error: "ZERO_VARIANCE" };
  }

  const zScore = (variantRate - controlRate) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  const zThreshold = zThresholdFor(confidenceLevel);
  const isSignificant = Math.abs(zScore) >= zThreshold;

  const diff = variantRate - controlRate;
  const marginOfError = zThreshold * standardError;
  const confidenceInterval = {
    lower: diff - marginOfError,
    upper: diff + marginOfError
  };

  return {
    valid: true,
    controlRate,
    variantRate,
    effectSize: diff,
    relativeEffect: controlRate > 0 ? diff / controlRate : null,
    zScore,
    pValue,
    confidenceLevel,
    isSignificant,
    confidenceInterval
  };
}

/**
 * Determines the experiment's result state from a significance result.
 * Never forces a winner — an insignificant result is reported as such,
 * not as a tie broken toward either arm.
 * @param {Object} params
 * @param {boolean} params.isSignificant
 * @param {number} params.variantRate
 * @param {number} params.controlRate
 * @returns {"NO_CLEAR_DIFFERENCE"|"VARIANT_SUPPORTED"|"CONTROL_SUPPORTED"|"INCONCLUSIVE"}
 */
export function determineResultState({ isSignificant, variantRate, controlRate }) {
  if (!isSignificant) {
    return "NO_CLEAR_DIFFERENCE";
  }

  if (variantRate > controlRate) {
    return "VARIANT_SUPPORTED";
  }

  if (variantRate < controlRate) {
    return "CONTROL_SUPPORTED";
  }

  // Significant per the z-test but rates are exactly equal — shouldn't be
  // reachable given the z-test math (a nonzero z-score requires a rate
  // difference), but kept as a safety fallback rather than assuming.
  return "INCONCLUSIVE";
}
