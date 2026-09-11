/**
 * @file Lightweight MVP logger for agent run events.
 *
 * Per the roadmap's Logging & Observability section, every meaningful
 * moment in a run's lifecycle (started, plan generated, a step
 * completed/failed, a tool/model called, ...) should be logged. For the
 * MVP this just writes to the console and hands back the log entry —
 * persisting entries to a dedicated collection/service (so runs can be
 * queried and audited after the fact, rather than only seen in console
 * output) is a natural next enhancement, not implemented here yet.
 */

/**
 * The lifecycle events a run can log.
 * @typedef {"run_started"|"context_built"|"plan_generated"|"step_started"|
 *   "step_completed"|"step_failed"|"tool_called"|"model_called"|
 *   "validation_passed"|"validation_failed"|"run_completed"|"run_failed"} AgentEventType
 */

/**
 * A single logged event.
 * @typedef {Object} LogEntry
 * @property {string} runId - The AgentRun this event belongs to.
 * @property {AgentEventType} eventType - What happened.
 * @property {*} details - Event-specific detail payload.
 * @property {Date} timestamp - When the event was logged.
 */

/**
 * Logs an event in an AgentRun's lifecycle.
 * @param {string} runId - The AgentRun this event belongs to.
 * @param {AgentEventType} eventType - What happened.
 * @param {*} details - Event-specific detail payload.
 * @returns {LogEntry} The log entry, so callers can persist it later if needed.
 */
export function logEvent(runId, eventType, details) {
  const entry = {
    runId,
    eventType,
    details,
    timestamp: new Date()
  };

  console.log(`[AgentRun ${runId}] ${eventType}:`, details);

  return entry;
}
