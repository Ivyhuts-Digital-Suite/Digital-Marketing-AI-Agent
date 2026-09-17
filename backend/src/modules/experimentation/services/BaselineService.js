import AnalyticsSnapshot from "../../../models/analyticsSnapshot.model.js";
import MetricRecord from "../../../models/metricRecord.model.js";

/**
 * @file BaselineService — computes a metric's historical baseline for
 * experimentation.
 *
 * Per the roadmap's rule "never create a second analytics system, reuse
 * Phase 11": this reads from the existing AnalyticsSnapshot/MetricRecord
 * models rather than building new aggregation logic. A full-codebase
 * search confirmed both models exist but currently have no
 * producer/writer anywhere — nothing populates them yet, so every real
 * call to calculateBaseline() will hit the "no data available"
 * placeholder path until Phase 11's analytics engine exists. Once it
 * does and starts writing MetricRecord documents, this service's query
 * logic can be reused as-is; only the placeholder path becomes obsolete.
 *
 * AnalyticsSnapshot is imported for forward compatibility — a natural
 * second data source for baselines (pre-aggregated snapshots rather
 * than raw records) — but isn't queried yet, since MetricRecord alone
 * is enough for a simple average-based baseline.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Computes a metric's historical baseline from MetricRecord data.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.metric - The metric name to average.
 * @param {string} [params.channel] - Optional channel filter.
 * @param {string} [params.contentType] - Accepted for forward-compatibility;
 *   not yet applied, since MetricRecord has no matching field today (only
 *   entityType/entityId, e.g. entityType: "content").
 * @param {number} [params.lookbackDays=28] - How many days back to look.
 * @returns {Promise<Object>} The baseline result (real or placeholder).
 */
export async function calculateBaseline({
  organizationId,
  metric,
  channel,
  contentType,
  lookbackDays = 28
}) {
  try {
    const since = new Date(Date.now() - lookbackDays * MS_PER_DAY);

    const query = {
      organizationId,
      metric,
      recordedAt: { $gte: since }
    };

    if (channel) {
      query.channel = channel;
    }

    const records = await MetricRecord.find(query).select("value").lean();

    if (records.length === 0) {
      return {
        metric,
        value: null,
        source: "no_data_available",
        lookbackDays,
        sampleSize: 0,
        calculatedAt: new Date(),
        note: "No historical MetricRecord data found. A real baseline requires Phase 11's analytics engine to be populated. This is a placeholder result, not a real baseline."
      };
    }

    const total = records.reduce((sum, record) => sum + record.value, 0);

    return {
      metric,
      value: total / records.length,
      source: "historical_metric_records",
      lookbackDays,
      sampleSize: records.length,
      calculatedAt: new Date()
    };
  } catch (error) {
    return {
      metric,
      value: null,
      source: "no_data_available",
      lookbackDays,
      sampleSize: 0,
      calculatedAt: new Date(),
      note: `No historical MetricRecord data found. A real baseline requires Phase 11's analytics engine to be populated. This is a placeholder result, not a real baseline. Error: ${error.message}`
    };
  }
}
