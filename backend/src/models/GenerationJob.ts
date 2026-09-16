import mongoose, { Document, Schema, Types } from "mongoose";
import { CreativeAssetType } from "./CreativeAsset";

const GENERATION_JOB_STATUSES = ["queued", "processing", "completed", "failed", "cancelled"] as const;
export type GenerationJobStatus = (typeof GENERATION_JOB_STATUSES)[number];

export { GENERATION_JOB_STATUSES };

/**
 * Tracks one generation run (graphic or video) end to end. Today's
 * providers resolve synchronously, so a job's whole queued -> processing ->
 * completed/failed lifecycle happens within a single request - but the
 * shape is async-ready (progress, startedAt/completedAt, resultAssetIds)
 * so a future queue-backed provider can update the same document over time
 * instead of needing a new model.
 */
export interface IGenerationJob extends Document {
  organizationId: Types.ObjectId;
  contentPlanId: Types.ObjectId;
  contentItemId: Types.ObjectId;
  creativeBriefId: Types.ObjectId;

  assetType: CreativeAssetType;
  provider: string;
  /** Model id actually used for this run (e.g. "gemini-3.1-flash-image", "veo-3.1-fast-generate-preview"). */
  providerModel?: string;
  request?: Record<string, unknown>;

  /** The provider's own job/operation identifier, for providers whose generation is asynchronous (e.g. a Veo long-running operation name). Absent for synchronous providers. */
  providerJobId?: string;
  /** Opaque, provider-specific state needed to resume polling an async operation across requests (e.g. the last GenerateVideosOperation payload) - never read by calling code, only round-tripped back into the provider's checkStatus(). */
  providerOperationState?: Record<string, unknown>;

  status: GenerationJobStatus;
  progress: number;
  resultAssetIds: Types.ObjectId[];
  error?: string;
  retryCount: number;

  startedAt?: Date;
  completedAt?: Date;
}

const generationJobSchema = new Schema<IGenerationJob>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentPlanId: { type: Schema.Types.ObjectId, ref: "ContentPlan", required: true, index: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", required: true, index: true },
    creativeBriefId: { type: Schema.Types.ObjectId, ref: "CreativeBrief", required: true },

    assetType: { type: String, required: true },
    provider: { type: String, required: true },
    providerModel: { type: String },
    request: { type: Schema.Types.Mixed, default: {} },

    providerJobId: { type: String },
    providerOperationState: { type: Schema.Types.Mixed },

    status: { type: String, enum: GENERATION_JOB_STATUSES, default: "queued", required: true, index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    resultAssetIds: [{ type: Schema.Types.ObjectId, ref: "CreativeAsset" }],
    error: { type: String },
    retryCount: { type: Number, default: 0 },

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const GenerationJob = mongoose.model<IGenerationJob>("GenerationJob", generationJobSchema);

export default GenerationJob;
