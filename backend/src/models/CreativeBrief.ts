import mongoose, { Document, Schema, Types } from "mongoose";
import { ContentFormat, ContentGoal, FunnelStage } from "../services/contentIntelligence/content.types";
import { ISourceReference, sourceReferenceSchema } from "./common/sourceReference";

const CREATIVE_BRIEF_STATUSES = ["draft", "ready", "used", "archived"] as const;
export type CreativeBriefStatus = (typeof CREATIVE_BRIEF_STATUSES)[number];

const CREATIVE_BRIEF_ASPECT_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;
export type CreativeBriefAspectRatio = (typeof CREATIVE_BRIEF_ASPECT_RATIOS)[number];

export { CREATIVE_BRIEF_STATUSES, CREATIVE_BRIEF_ASPECT_RATIOS };

/**
 * Visual/production direction for a Creative Brief. Everything here is
 * either LLM-authored (grounded in the ContentItem's already-approved
 * copy) or defaulted deterministically by the backend - never a substitute
 * for the ContentItem's own marketing fields.
 */
export interface IVisualDirection {
  style?: string;
  mood?: string;
  composition?: string;
  visualElements: string[];
  colorGuidance?: string;
  typographyGuidance?: string;
  aspectRatio: CreativeBriefAspectRatio;
}

export interface IBrandContextSnapshot {
  brandVoice?: string;
  allowedClaims: string[];
  forbiddenClaims: string[];
}

const visualDirectionSchema = new Schema<IVisualDirection>(
  {
    style: { type: String },
    mood: { type: String },
    composition: { type: String },
    visualElements: { type: [String], default: [] },
    colorGuidance: { type: String },
    typographyGuidance: { type: String },
    aspectRatio: { type: String, enum: CREATIVE_BRIEF_ASPECT_RATIOS, required: true },
  },
  { _id: false }
);

const brandContextSnapshotSchema = new Schema<IBrandContextSnapshot>(
  {
    brandVoice: { type: String },
    allowedClaims: { type: [String], default: [] },
    forbiddenClaims: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * The bridge between a ContentItem (what the Content Calendar decided to
 * say) and media generation (how it should look/sound). All ownership and
 * marketing-content fields (organizationId, contentPlanId, contentItemId,
 * topic, hook, coreMessage, keyPoints, cta, ...) are copied verbatim from
 * the ContentItem by the backend - the LLM that fills in toneOfVoice/
 * visualDirection/generationRequirements never sees or sets those fields,
 * so it cannot redirect a brief to a different item/organization or alter
 * the underlying marketing message.
 *
 * One brief per ContentItem: contentItemId is unique, and regenerating a
 * brief upserts in place with an incrementing version, mirroring
 * CompanyIntelligence/BrandProfile's own versioning.
 */
export interface ICreativeBrief extends Document {
  organizationId: Types.ObjectId;
  contentPlanId: Types.ObjectId;
  contentItemId: Types.ObjectId;

  platform: "instagram";
  format: ContentFormat;
  objective: ContentGoal;
  targetAudience: string;
  funnelStage: FunnelStage;
  contentPillar: string;

  topic: string;
  angle: string;
  hook: string;
  coreMessage: string;
  keyPoints: string[];
  cta: string;

  toneOfVoice?: string;
  brandContext: IBrandContextSnapshot;
  visualDirection: IVisualDirection;
  generationRequirements: string[];

  sourceReferences: ISourceReference[];
  status: CreativeBriefStatus;
  version: number;
}

const creativeBriefSchema = new Schema<ICreativeBrief>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentPlanId: { type: Schema.Types.ObjectId, ref: "ContentPlan", required: true, index: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", required: true, unique: true },

    platform: { type: String, enum: ["instagram"], default: "instagram", required: true },
    format: { type: String, required: true },
    objective: { type: String, required: true },
    targetAudience: { type: String, required: true },
    funnelStage: { type: String, required: true },
    contentPillar: { type: String, required: true },

    topic: { type: String, required: true },
    angle: { type: String, required: true },
    hook: { type: String, required: true },
    coreMessage: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    cta: { type: String, required: true },

    toneOfVoice: { type: String },
    brandContext: { type: brandContextSnapshotSchema, default: () => ({}) },
    visualDirection: { type: visualDirectionSchema, required: true },
    generationRequirements: { type: [String], default: [] },

    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    status: { type: String, enum: CREATIVE_BRIEF_STATUSES, default: "ready", required: true, index: true },
    version: { type: Number, default: 1, required: true },
  },
  {
    timestamps: true,
  }
);

const CreativeBrief = mongoose.model<ICreativeBrief>("CreativeBrief", creativeBriefSchema);

export default CreativeBrief;
