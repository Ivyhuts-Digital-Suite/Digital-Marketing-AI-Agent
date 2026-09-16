import mongoose, { Document, Schema, Types } from "mongoose";

const CREATIVE_ASSET_TYPES = ["image", "graphic", "video", "audio"] as const;
export type CreativeAssetType = (typeof CREATIVE_ASSET_TYPES)[number];

const CREATIVE_ASSET_STATUSES = ["queued", "processing", "generated", "validated", "approved", "failed"] as const;
export type CreativeAssetStatus = (typeof CREATIVE_ASSET_STATUSES)[number];

export { CREATIVE_ASSET_TYPES, CREATIVE_ASSET_STATUSES };

export interface IBrandValidationResult {
  passed: boolean;
  score?: number;
  issues: string[];
  suggestions: string[];
}

const brandValidationResultSchema = new Schema<IBrandValidationResult>(
  {
    passed: { type: Boolean, required: true },
    score: { type: Number },
    issues: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * One generated media asset (an image, a carousel slide, a video, ...)
 * produced for a ContentItem via its CreativeBrief. Every asset traces
 * back through creativeBriefId -> contentItemId -> contentPlanId ->
 * organizationId, so nothing generated can be orphaned from the calendar
 * that authorized it. `isMock` on generationConfig/metadata (set by the
 * provider, see providers/) makes clear when an asset came from a
 * development/mock provider rather than a real production generator.
 */
export interface ICreativeAsset extends Document {
  organizationId: Types.ObjectId;
  contentPlanId: Types.ObjectId;
  contentItemId: Types.ObjectId;
  creativeBriefId: Types.ObjectId;
  generationJobId?: Types.ObjectId;
  /** Phase 9 - Step 13: the asset this one replaced, when this generation was a regeneration (e.g. after CHANGES_REQUESTED). Never set on a first generation. Old assets are never deleted - this is purely a "what replaced what" pointer for the audit trail/UI. */
  previousAssetId?: Types.ObjectId;
  /** Why this asset was regenerated (e.g. the reviewer's change-request comment). Absent on a first generation. */
  regenerationReason?: string;

  type: CreativeAssetType;
  /** Free-form specialization, e.g. "instagram_post", "carousel_slide", "instagram_reel". */
  subtype?: string;
  /** The ContentItem's ContentFormat at generation time (e.g. "instagram_carousel"), denormalized for convenient filtering. */
  format?: string;

  provider: string;
  /** Model id actually used to generate this asset (e.g. "gemini-3.1-flash-image"). */
  providerModel?: string;
  providerAssetId?: string;
  /** Where the asset actually lives (URL or storage key), depending on the provider. */
  url?: string;
  /** Storage key for the underlying file when stored via FileStorageService (see services/storage) - lets a real asset be re-fetched/deleted independent of its public URL. */
  storageKey?: string;
  mimeType?: string;

  metadata?: Record<string, unknown>;
  generationConfig?: Record<string, unknown>;
  validation?: IBrandValidationResult;

  status: CreativeAssetStatus;
  version: number;
}

const creativeAssetSchema = new Schema<ICreativeAsset>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentPlanId: { type: Schema.Types.ObjectId, ref: "ContentPlan", required: true, index: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", required: true, index: true },
    creativeBriefId: { type: Schema.Types.ObjectId, ref: "CreativeBrief", required: true, index: true },
    generationJobId: { type: Schema.Types.ObjectId, ref: "GenerationJob" },
    previousAssetId: { type: Schema.Types.ObjectId, ref: "CreativeAsset" },
    regenerationReason: { type: String },

    type: { type: String, enum: CREATIVE_ASSET_TYPES, required: true },
    subtype: { type: String },
    format: { type: String },

    provider: { type: String, required: true },
    providerModel: { type: String },
    providerAssetId: { type: String },
    url: { type: String },
    storageKey: { type: String },
    mimeType: { type: String },

    metadata: { type: Schema.Types.Mixed, default: {} },
    generationConfig: { type: Schema.Types.Mixed, default: {} },
    validation: { type: brandValidationResultSchema },

    status: { type: String, enum: CREATIVE_ASSET_STATUSES, default: "queued", required: true, index: true },
    version: { type: Number, default: 1, required: true },
  },
  {
    timestamps: true,
  }
);

creativeAssetSchema.index({ organizationId: 1, contentItemId: 1 });

const CreativeAsset = mongoose.model<ICreativeAsset>("CreativeAsset", creativeAssetSchema);

export default CreativeAsset;
