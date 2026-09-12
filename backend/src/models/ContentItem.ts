import mongoose, { Document, Schema, Types } from "mongoose";
import {
  ContentChannel,
  ContentFormat,
  ContentGoal,
  ContentItemStatus,
  FunnelStage,
} from "../services/contentIntelligence/content.types";

const CONTENT_GOALS: ContentGoal[] = [
  "generate_leads",
  "increase_awareness",
  "launch_product",
  "increase_engagement",
  "build_authority",
  "drive_website_traffic",
];
const FUNNEL_STAGES: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];
const CONTENT_CHANNELS: ContentChannel[] = ["instagram", "blog", "landing_page", "email", "paid_marketing"];
const CONTENT_FORMATS: ContentFormat[] = [
  "instagram_post",
  "instagram_carousel",
  "instagram_reel",
  "instagram_story",
  "instagram_caption",
  "blog",
  "landing_page",
  "email",
  "ad_copy",
  "ad_creative_brief",
];
const CONTENT_ITEM_STATUSES: ContentItemStatus[] = ["draft", "scheduled", "published", "archived"];

/**
 * personaId is a plain string (not an ObjectId ref) because content.types'
 * ContentAudience.personaId is a generic identifier, not necessarily tied
 * to a Persona collection - no Persona model exists in this branch yet.
 */
export interface IContentItemPersona {
  personaId?: string;
  description: string;
}

export interface IContentItemEvidence {
  sourceId: Types.ObjectId;
  chunkId?: Types.ObjectId;
  excerpt?: string;
  url?: string;
  label?: string;
  score?: number;
}

/**
 * Phase 7 - Step 2: ContentItem persistence model - one scheduled piece of
 * content within a ContentPlan. Mirrors the ContentItem contract from
 * content.types.ts exactly (persona/message/cta naming, not
 * audience/coreMessage/cta as on ContentBrief).
 */
export interface IContentItem extends Document {
  contentPlanId: Types.ObjectId;
  organizationId: Types.ObjectId;
  goal: ContentGoal;
  persona: IContentItemPersona;
  funnelStage: FunnelStage;
  contentPillar: string;
  topic: string;
  angle: string;
  channel: ContentChannel;
  format: ContentFormat;
  hook: string;
  message: string;
  cta: string;
  rationale: string;
  evidence: IContentItemEvidence[];
  scheduledDate: Date;
  status: ContentItemStatus;
}

const contentItemPersonaSchema = new Schema<IContentItemPersona>(
  {
    personaId: { type: String },
    description: { type: String, required: true },
  },
  { _id: false }
);

const contentItemEvidenceSchema = new Schema<IContentItemEvidence>(
  {
    sourceId: { type: Schema.Types.ObjectId, ref: "KnowledgeSource", required: true },
    chunkId: { type: Schema.Types.ObjectId, ref: "KnowledgeChunk" },
    excerpt: { type: String },
    url: { type: String },
    label: { type: String },
    score: { type: Number },
  },
  { _id: false }
);

const contentItemSchema = new Schema<IContentItem>(
  {
    contentPlanId: { type: Schema.Types.ObjectId, ref: "ContentPlan", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    goal: { type: String, enum: CONTENT_GOALS, required: true },
    persona: { type: contentItemPersonaSchema, required: true },
    funnelStage: { type: String, enum: FUNNEL_STAGES, required: true, index: true },

    contentPillar: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    angle: { type: String, required: true },

    channel: { type: String, enum: CONTENT_CHANNELS, required: true },
    format: { type: String, enum: CONTENT_FORMATS, required: true },

    hook: { type: String, required: true },
    message: { type: String, required: true },
    cta: { type: String, required: true },

    rationale: { type: String, required: true },
    evidence: { type: [contentItemEvidenceSchema], default: [] },

    scheduledDate: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: CONTENT_ITEM_STATUSES,
      default: "draft",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

contentItemSchema.index({ organizationId: 1, contentPlanId: 1, scheduledDate: 1 });

const ContentItem = mongoose.model<IContentItem>("ContentItem", contentItemSchema);

export default ContentItem;
