/**
 * DTOs mirroring the live backend exactly (backend/src/models, backend/src/services/contentIntelligence,
 * backend/src/services/contentStudio). Every shape here was verified against the actual Mongoose
 * schemas/controllers, not guessed - keep this file in sync if the backend contracts change.
 */

// ---------------------------------------------------------------------------
// Shared/content intelligence vocabulary (backend/src/services/contentIntelligence/content.types.ts)
// ---------------------------------------------------------------------------

export type ContentGoal =
  | "generate_leads"
  | "increase_awareness"
  | "launch_product"
  | "increase_engagement"
  | "build_authority"
  | "drive_website_traffic";

export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

export type ContentChannel = "instagram" | "blog" | "landing_page" | "email" | "paid_marketing";

export type ContentFormat =
  | "instagram_post"
  | "instagram_carousel"
  | "instagram_reel"
  | "instagram_story"
  | "instagram_caption"
  | "blog"
  | "landing_page"
  | "email"
  | "ad_copy"
  | "ad_creative_brief";

export type ContentPlanDuration = "1_week" | "2_weeks" | "1_month" | "3_months" | "6_months" | "custom";

export type ContentPlanStatus = "draft" | "active" | "finalized" | "in_progress" | "completed" | "archived";

/**
 * Phase 9: three independent lifecycle axes on ContentItem, replacing the
 * old single `status` field (backend/src/services/contentIntelligence/content.types.ts).
 */
export type ContentGenerationStatus = "planned" | "brief_ready" | "generating" | "generated" | "failed";
export type ContentApprovalStatus = "draft" | "review" | "changes_requested" | "approved";
export type ContentPublishingStatus = "unscheduled" | "scheduled" | "published" | "failed" | "archived";
export type ContentPlatform = "instagram";

export interface ContentItemPersona {
  personaId?: string;
  description: string;
}

export interface ContentItemEvidence {
  sourceId: string;
  chunkId?: string;
  excerpt?: string;
  url?: string;
  label?: string;
  score?: number;
}

// ---------------------------------------------------------------------------
// ContentPlan / ContentItem (backend/src/models/ContentPlan.ts, ContentItem.ts)
// ---------------------------------------------------------------------------

export interface ContentPlan {
  _id: string;
  organizationId: string;
  strategyId?: string;
  campaignId?: string;
  duration: ContentPlanDuration;
  startDate: string;
  endDate: string;
  objectives: string[];
  status: ContentPlanStatus;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  _id: string;
  contentPlanId: string;
  organizationId: string;
  goal: ContentGoal;
  persona: ContentItemPersona;
  funnelStage: FunnelStage;
  contentPillar: string;
  topic: string;
  angle: string;
  channel: ContentChannel;
  format: ContentFormat;
  hook: string;
  message: string;
  keyPoints: string[];
  cta: string;
  rationale: string;
  evidence: ContentItemEvidence[];
  /** The Content Intelligence-planned calendar date - distinct from `scheduledAt`, the actual publish datetime set later via the Schedule action. */
  scheduledDate: string;

  generationStatus: ContentGenerationStatus;
  approvalStatus: ContentApprovalStatus;
  publishingStatus: ContentPublishingStatus;
  platform: ContentPlatform;

  scheduledAt?: string;
  scheduledTimezone?: string;
  publishedAt?: string;
  externalPostId?: string;
  publishingProvider?: string;

  reviewerId?: string;
  reviewedAt?: string;
  reviewComment?: string;

  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Phase 9: Content Lifecycle (backend/src/models/ContentQualityCheck.ts, ContentLifecycleHistory.ts)
// ---------------------------------------------------------------------------

export type ContentQualityCheckStatus = "PASS" | "FAIL";

export interface QualityCheckCategory {
  passed: boolean;
  score: number;
  notes: string[];
}

export interface FlaggedClaim {
  claim: string;
  type: "forbidden" | "unsupported";
  reason: string;
}

export interface ContentQualityCheck {
  _id: string;
  organizationId: string;
  contentPlanId: string;
  contentItemId: string;
  creativeBriefId: string;
  assetIds: string[];
  score: number;
  status: ContentQualityCheckStatus;
  checks: {
    strategyAlignment: QualityCheckCategory;
    messaging: QualityCheckCategory;
    brandSafety: QualityCheckCategory;
    instagramFit: QualityCheckCategory;
    graphics?: QualityCheckCategory;
    video?: QualityCheckCategory;
  };
  flaggedClaims: FlaggedClaim[];
  issues: string[];
  warnings: string[];
  recommendations: string[];
  checkedAt: string;
  aiModel: string;
  aiModelVersion?: string;
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  createdAt: string;
  updatedAt: string;
}

export type ContentLifecycleStatusField = "generationStatus" | "approvalStatus" | "publishingStatus";
export type ContentLifecycleActorType = "AI" | "USER" | "SYSTEM";

export interface ContentLifecycleHistoryEntry {
  _id: string;
  organizationId: string;
  contentItemId: string;
  statusField: ContentLifecycleStatusField;
  fromStatus: string;
  toStatus: string;
  actorType: ContentLifecycleActorType;
  actorId?: string;
  actorLabel?: string;
  comment?: string;
  timestamp: string;
}

/** POST/GET .../submit-review, /approve, /request-changes, /archive, /schedule - all return the updated item in this shape. */
export interface ContentLifecycleActionResponse {
  success: true;
  message: string;
  data: ContentItem;
}

/** GET .../history */
export interface GetContentHistoryResponse {
  success: true;
  message: string;
  data: ContentLifecycleHistoryEntry[];
}

/** POST/GET .../quality-check */
export interface QualityCheckResponse {
  success: true;
  message: string;
  data: ContentQualityCheck;
}

export interface RequestChangesInput {
  comment: string;
}

export interface ApproveContentInput {
  comment?: string;
}

export interface ScheduleContentInput {
  scheduledAt: string;
  scheduledTimezone: string;
}

// ---------------------------------------------------------------------------
// Content Intelligence request/response envelopes (backend/src/controllers/contentIntelligence.controller.ts)
// ---------------------------------------------------------------------------

export interface GenerateContentPlanInput {
  organizationId: string;
  goal: ContentGoal;
  duration: ContentPlanDuration;
  strategyId?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  itemsPerWeek?: number;
}

export interface GenerateContentPlanResult {
  contentPlanId: string;
  itemCount: number;
  startDate: string;
  endDate: string;
  warnings: string[];
  validationWarnings: string[];
}

/** POST /api/content-intelligence/plans */
export interface GenerateContentPlanResponse {
  message: string;
  result: GenerateContentPlanResult;
}

/** GET /api/content-intelligence/plans/:organizationId */
export interface ListContentPlansResponse {
  plans: ContentPlan[];
}

/** GET /api/content-intelligence/plans/:organizationId/:planId - NOT wrapped in message/success, returned as-is. */
export interface ContentPlanWithItemsResponse {
  plan: ContentPlan;
  items: ContentItem[];
}

/** POST /api/content-intelligence/plans/:planId/finalize */
export interface FinalizeContentPlanResponse {
  message: string;
  plan: ContentPlan;
}

// ---------------------------------------------------------------------------
// Content Studio (backend/src/models/CreativeBrief.ts, CreativeAsset.ts, GenerationJob.ts)
// ---------------------------------------------------------------------------

export type CreativeBriefAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type CreativeBriefStatus = "draft" | "ready" | "used" | "archived";

export interface VisualDirection {
  style?: string;
  mood?: string;
  composition?: string;
  visualElements: string[];
  colorGuidance?: string;
  typographyGuidance?: string;
  aspectRatio: CreativeBriefAspectRatio;
}

export interface BrandContextSnapshot {
  brandVoice?: string;
  allowedClaims: string[];
  forbiddenClaims: string[];
}

export interface SourceReference {
  sourceType: "onboarding" | "website" | "document" | "knowledge_chunk";
  sourceId?: string;
  url?: string;
  label?: string;
}

export interface CreativeBrief {
  _id: string;
  organizationId: string;
  contentPlanId: string;
  contentItemId: string;
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
  brandContext: BrandContextSnapshot;
  visualDirection: VisualDirection;
  generationRequirements: string[];
  sourceReferences: SourceReference[];
  status: CreativeBriefStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CreativeAssetType = "image" | "graphic" | "video" | "audio";
export type CreativeAssetStatus = "queued" | "processing" | "generated" | "validated" | "approved" | "failed";

export interface BrandValidationResult {
  passed: boolean;
  score?: number;
  issues: string[];
  suggestions: string[];
}

export interface CreativeAsset {
  _id: string;
  organizationId: string;
  contentPlanId: string;
  contentItemId: string;
  creativeBriefId: string;
  generationJobId?: string;
  type: CreativeAssetType;
  subtype?: string;
  provider: string;
  providerModel?: string;
  providerAssetId?: string;
  url?: string;
  storageKey?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  generationConfig?: Record<string, unknown>;
  validation?: BrandValidationResult;
  status: CreativeAssetStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type GenerationJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface GenerationJob {
  _id: string;
  organizationId: string;
  contentPlanId: string;
  contentItemId: string;
  creativeBriefId: string;
  assetType: CreativeAssetType;
  provider: string;
  providerModel?: string;
  request?: Record<string, unknown>;
  status: GenerationJobStatus;
  progress: number;
  resultAssetIds: string[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** MotionGraphicScene (backend/src/services/contentStudio/contentStudio.types.ts) - stored on a video CreativeAsset's generationConfig.scenes, and returned inline by /videos/generate. */
export interface MotionGraphicScene {
  sceneNumber: number;
  duration: number;
  narration?: string;
  onScreenText?: string;
  visualDescription: string;
  animationInstructions?: string;
  transition?: string;
  assetRequirements?: string[];
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  hook: string;
  cta: string;
}

export interface ContentStudioRequest {
  contentPlanId: string;
  contentItemId: string;
  regenerate?: boolean;
}

/** POST /api/content-studio/briefs */
export interface CreateCreativeBriefResponse {
  success: true;
  message: string;
  data: CreativeBrief;
}

/** GET /api/content-studio/briefs/:contentItemId - data is null when no brief has been generated yet (not an error). */
export interface GetCreativeBriefResponse {
  success: true;
  message: string;
  data: CreativeBrief | null;
}

/** POST /api/content-studio/graphics/generate */
export interface GenerateGraphicResponse {
  success: true;
  message: string;
  data: {
    job: GenerationJob;
    assets: CreativeAsset[];
    brief: CreativeBrief;
  };
}

/** POST /api/content-studio/videos/generate */
export interface GenerateVideoResponse {
  success: true;
  message: string;
  data: {
    job: GenerationJob;
    assets: CreativeAsset[];
    brief: CreativeBrief;
    script: VideoScript;
    scenes: MotionGraphicScene[];
  };
}

/** GET /api/content-studio/assets/:contentItemId */
export interface GetContentAssetsResponse {
  success: true;
  message: string;
  data: CreativeAsset[];
}

/** GET /api/content-studio/jobs/:jobId */
export interface GetGenerationJobResponse {
  success: true;
  message: string;
  data: GenerationJob;
}

// ---------------------------------------------------------------------------
// Auth (backend/src/controllers/auth.controller.ts)
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  /** The auto-provisioned starter organization for this user (backend/src/controllers/auth.controller.ts). */
  organization?: { id: string; name: string; slug: string };
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface GetCurrentUserResponse {
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Organizations (backend/src/controllers/organization.controller.ts)
// ---------------------------------------------------------------------------

export type OrganizationRole = "owner" | "admin" | "member";

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  /** The authenticated user's role in this organization. */
  role: OrganizationRole;
}

/** GET /api/organizations */
export interface ListOrganizationsResponse {
  success: true;
  data: Organization[];
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
}

/** POST /api/organizations */
export interface CreateOrganizationResponse {
  success: true;
  data: Organization;
}
