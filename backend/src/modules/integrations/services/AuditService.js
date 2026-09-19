import mongoose from "mongoose";
import AuditLog from "../../../models/auditLog.model.js";

/**
 * @file Writes integration actions to the existing AuditLog collection,
 * per the roadmap's "reuse existing AuditLog infrastructure where
 * appropriate instead of duplicating it" instruction.
 *
 * This does not replace IntegrationExecution — IntegrationExecution
 * stays the specialized, idempotency/status-tracked record of a single
 * tool call; this writes the org-wide compliance-trail entry alongside
 * it. Call this from integration tools when an action completes or
 * fails, not as a substitute for their own IntegrationExecution
 * bookkeeping.
 *
 * AuditLog.actorId is a real User ObjectId reference, but integration
 * actions are usually taken by an agent or the system (e.g.
 * "ContentStudioAgent", a run id) — string identifiers, not User
 * documents. Rather than force those into an invalid ObjectId, this
 * resolves actorId to null for non-user actors and preserves the
 * original identifier in metadata.actorLabel instead.
 */

/**
 * Resolves the actorId to store on the AuditLog entry.
 * @param {string} actorType
 * @param {string} actorId
 * @returns {{ resolvedActorId: string|null, actorLabel: string|undefined }}
 */
function resolveActor(actorType, actorId) {
  if (actorType === "user" && actorId && mongoose.Types.ObjectId.isValid(actorId)) {
    return { resolvedActorId: actorId, actorLabel: undefined };
  }

  return { resolvedActorId: null, actorLabel: actorId };
}

/**
 * Logs an integration action to AuditLog.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.actorType - "user"|"agent"|"system".
 * @param {string} params.actorId - The actor's identifier (a User id when actorType is "user", otherwise a label).
 * @param {string} params.action - What happened, e.g. "publish_instagram_post".
 * @param {string} [params.entityType] - The type of entity affected, e.g. "Content".
 * @param {string} [params.entityId] - The affected entity's id.
 * @param {*} [params.newState] - The entity's state after this action.
 * @param {*} [params.metadata] - Additional context to store alongside the entry.
 * @returns {Promise<import("mongoose").Document|null>} The created AuditLog entry, or null on failure.
 */
export async function logIntegrationAction({
  organizationId,
  actorType,
  actorId,
  action,
  entityType,
  entityId,
  newState,
  metadata
}) {
  try {
    const { resolvedActorId, actorLabel } = resolveActor(actorType, actorId);

    return await AuditLog.create({
      organizationId,
      actorType,
      actorId: resolvedActorId,
      action,
      entityType,
      entityId,
      newState,
      metadata: {
        ...metadata,
        ...(actorLabel ? { actorLabel } : {})
      }
    });
  } catch (error) {
    console.error("logIntegrationAction failed:", error);
    return null;
  }
}
