import MetricRecord from "../../../models/metricRecord.model.js";
import ExperimentVariant from "../../../models/experimentVariant.model.js";

/**
 * @file MeasurementService — reads what happened to a given experiment
 * arm after execution, per Section 17-18: "After execution, Phase 11
 * collects the data. The experiment engine asks: what happened to each
 * group?"
 *
 * Per the roadmap's rule "never create a second analytics system, reuse
 * Phase 11": this reads from the existing MetricRecord model rather than
 * building new aggregation logic, matching BaselineService.js's own
 * approach. A full-codebase search (done for BaselineService.js, same
 * finding applies here) confirmed MetricRecord exists but currently has
 * no producer/writer anywhere — nothing populates it yet, so every real
 * call to measureExperimentArm() will hit the "no data available"
 * placeholder path until Phase 11's analytics engine exists. Once it
 * does and starts writing MetricRecord documents, this service's query
 * logic can be reused as-is; only the placeholder path becomes obsolete.
 *
 * MetricRecord has no `contentId` field — it identifies what a record is
 * about via `entityType`/`entityId` (e.g. entityType: "content"). A
 * variant's `contentId` is queried as `entityType: "content", entityId:
 * variant.contentId`.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Measures a single experiment arm's real-world performance on a metric,
 * by reading the ExperimentVariant's linked content and querying
 * MetricRecord for it.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.experimentId
 * @param {"control"|"variant"} params.variantType
 * @param {string} params.metric - The metric name to measure.
 * @param {number} [params.lookbackDays=14] - How many days back to look.
 * @returns {Promise<Object>} { success: true, metric, value, source, sampleSize, lookbackDays, calculatedAt, note? }
 *   or { success: false, error }.
 */
export async function measureExperimentArm({
  organizationId,
  experimentId,
  variantType,
  metric,
  lookbackDays = 14
}) {
  try {
    const variant = await ExperimentVariant.findOne({
      experimentId,
      type: variantType
    });

    if (!variant) {
      return { success: false, error: "VARIANT_NOT_FOUND" };
    }

    if (!variant.contentId) {
      return {
        success: true,
        metric,
        value: null,
        source: "no_data_available",
        lookbackDays,
        sampleSize: 0,
        calculatedAt: new Date(),
        note: "This variant has no linked contentId, so there is nothing to measure against MetricRecord."
      };
    }

    const since = new Date(Date.now() - lookbackDays * MS_PER_DAY);

    const records = await MetricRecord.find({
      organizationId,
      entityType: "content",
      entityId: variant.contentId,
      metric,
      recordedAt: { $gte: since }
    })
      .select("value")
      .lean();

    if (records.length === 0) {
      return {
        success: true,
        metric,
        value: null,
        source: "no_data_available",
        lookbackDays,
        sampleSize: 0,
        calculatedAt: new Date(),
        note: "No historical MetricRecord data found. Real measurement requires Phase 11's analytics engine to be populated. This is a placeholder result, not a real measurement."
      };
    }

    const total = records.reduce((sum, record) => sum + record.value, 0);

    return {
      success: true,
      metric,
      value: total / records.length,
      source: "historical_metric_records",
      lookbackDays,
      sampleSize: records.length,
      calculatedAt: new Date()
    };
  } catch (error) {
    return {
      success: true,
      metric,
      value: null,
      source: "no_data_available",
      lookbackDays,
      sampleSize: 0,
      calculatedAt: new Date(),
      note: `No historical MetricRecord data found. Real measurement requires Phase 11's analytics engine to be populated. This is a placeholder result, not a real measurement. Error: ${error.message}`
    };
  }
}

/**
 * Measures both arms of an experiment on the same metric in one call —
 * a thin convenience wrapper around two measureExperimentArm() calls.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.experimentId
 * @param {string} params.metric - The metric name to measure.
 * @param {number} [params.lookbackDays=14] - How many days back to look.
 * @returns {Promise<{ control: Object, variant: Object }>} Each arm's
 *   measureExperimentArm() result, keyed by arm.
 */
export async function measureExperiment({ organizationId, experimentId, metric, lookbackDays }) {
  const [control, variant] = await Promise.all([
    measureExperimentArm({ organizationId, experimentId, variantType: "control", metric, lookbackDays }),
    measureExperimentArm({ organizationId, experimentId, variantType: "variant", metric, lookbackDays })
  ]);

  return { control, variant };
}
