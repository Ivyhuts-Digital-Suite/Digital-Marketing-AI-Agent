import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 9 - Step 6: ContentLifecycleHistory.
 *
 * The audit trail every important ContentItem transition is written to -
 * the only place that can answer "why was this content changed?". Written
 * exclusively by services/contentStudio/contentLifecycleService.ts; no
 * controller writes here directly, so this is a complete record of every
 * transition that ever happened, never a partial one a controller forgot
 * to log.
 *
 * `statusField` distinguishes which of the three lifecycle axes changed
 * (see content.types.ts) - a single content item can have entries across
 * all three over its life.
 */
export type ContentLifecycleStatusField = "generationStatus" | "approvalStatus" | "publishingStatus";
export type ContentLifecycleActorType = "AI" | "USER" | "SYSTEM";

const STATUS_FIELDS: ContentLifecycleStatusField[] = ["generationStatus", "approvalStatus", "publishingStatus"];
const ACTOR_TYPES: ContentLifecycleActorType[] = ["AI", "USER", "SYSTEM"];

export interface IContentLifecycleHistory extends Document {
  organizationId: Types.ObjectId;
  contentItemId: Types.ObjectId;
  statusField: ContentLifecycleStatusField;
  fromStatus: string;
  toStatus: string;
  actorType: ContentLifecycleActorType;
  /** The User._id for actorType "USER"; a fixed label (e.g. "quality-check-service") for "AI"/"SYSTEM" - never a fabricated user id. */
  actorId?: Types.ObjectId;
  actorLabel?: string;
  comment?: string;
  timestamp: Date;
}

const contentLifecycleHistorySchema = new Schema<IContentLifecycleHistory>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", required: true, index: true },
    statusField: { type: String, enum: STATUS_FIELDS, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    actorType: { type: String, enum: ACTOR_TYPES, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorLabel: { type: String },
    comment: { type: String },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

contentLifecycleHistorySchema.index({ organizationId: 1, contentItemId: 1, timestamp: 1 });

const ContentLifecycleHistory = mongoose.model<IContentLifecycleHistory>(
  "ContentLifecycleHistory",
  contentLifecycleHistorySchema
);

export default ContentLifecycleHistory;
