/**
 * Phase 7 - Step 1: Content Data Contracts.
 *
 * Pure TypeScript shapes for the Content Intelligence Engine - content
 * planning, briefing, and scoring. Mirrors the plain-object style used by
 * companyIntelligence/types.ts (string ids, not Types.ObjectId) since no
 * database models exist for this domain yet.
 *
 * Does not define Mongoose models, controllers/routes, LLM calls, or
 * services - those are later Phase 7 steps. Does not modify Company
 * Intelligence, Strategy, or auth code.
 */

/** What a piece of content (or a whole plan) is meant to achieve. */
export type ContentGoal =
  | "generate_leads"
  | "increase_awareness"
  | "launch_product"
  | "increase_engagement"
  | "build_authority"
  | "drive_website_traffic";

/** Marketing funnel stage a piece of content targets. */
export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

/** Distribution channel a piece of content is produced for. */
export type ContentChannel = "instagram" | "blog" | "landing_page" | "email" | "paid_marketing";

/** Concrete content format, always a specialization of one ContentChannel. */
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

/**
 * Who a piece of content is written for. personaId is optional because not
 * every organization has defined personas yet - description always carries
 * enough information to write for, on its own.
 */
export interface ContentAudience {
  /** Reference to a Persona record, when one exists. Not enforced/validated here - no Persona model exists in this codebase yet. */
  personaId?: string;
  description: string;
}

/**
 * A single piece of supporting evidence grounding a brief's claims.
 * Deliberately shaped like (but decoupled from) the existing
 * ISourceReference / VectorSearchResultItem shapes, so a brief can cite a
 * whole KnowledgeSource or one specific retrieved KnowledgeChunk without
 * this contracts file depending on Mongoose types or the vector search
 * service's internals.
 */
export interface ContentEvidenceReference {
  /** KnowledgeSource._id this evidence was drawn from. */
  sourceId: string;
  /** KnowledgeChunk._id, when the evidence is one specific retrieved chunk rather than a whole source. */
  chunkId?: string;
  /** Short supporting excerpt/quote backing the brief's claim. */
  excerpt?: string;
  /** Website URL, when the source is a crawled page. */
  url?: string;
  /** Human-readable label (filename, page title, etc.). */
  label?: string;
  /** Relevance/similarity score, when this evidence came from a ranked retrieval (e.g. vector search). */
  score?: number;
}

/**
 * The full creative brief for one piece of content - everything a
 * generation step needs to write it, and everything a reviewer needs to
 * judge it, without regenerating it.
 */
export interface ContentBrief {
  organizationId: string;
  goal: ContentGoal;
  audience: ContentAudience;
  funnelStage: FunnelStage;
  /** Name of the content pillar this brief belongs to (organization-defined, not a fixed enum). */
  contentPillar: string;
  topic: string;
  /** The specific angle/take on the topic - what makes this brief distinct from another brief on the same topic. */
  angle: string;
  channel: ContentChannel;
  format: ContentFormat;
  hook: string;
  coreMessage: string;
  keyPoints: string[];
  cta: string;
  /** The metric this piece of content should move, e.g. "click-through rate" or "email sign-ups". */
  successMetric: string;
  /** Why this brief was produced this way - the reasoning a strategist would give for goal/audience/angle/channel choices. */
  rationale: string;
  evidence?: ContentEvidenceReference[];
}

/**
 * Scoring breakdown used to rank candidate topics before they become
 * ContentBriefs. Every component is expected to be normalized onto the same
 * scale (e.g. 0-100) by whatever produces a TopicScore; that scale is not
 * enforced by the type itself.
 */
export interface TopicScore {
  /** How relevant the topic is to the organization's business/industry. */
  relevance: number;
  /** How well the topic aligns with the active strategy/plan objectives. */
  strategicAlignment: number;
  /** How valuable the topic is expected to be to the target audience. */
  audienceValue: number;
  /** SEO/keyword demand signal, when keyword research data is available. */
  keywordOpportunity?: number;
  /** Alignment with current trends, when trend research data is available. */
  trendRelevance?: number;
  /** How fresh/undercovered the topic is relative to existing content. */
  novelty: number;
  /** Combined score used for ranking; derivation (weights, formula) is owned by whatever computes it, not by this type. */
  totalScore: number;
}

/** Planning cadence for a ContentPlan. A fixed vocabulary - startDate/endDate always carry the actual concrete range. */
export type ContentPlanDuration = "1_week" | "2_weeks" | "1_month" | "3_months" | "6_months" | "custom";

/**
 * "active"/"completed"/"archived" predate the Content Studio workflow and
 * are kept for backward compatibility with existing data. "finalized" and
 * "in_progress" are the states the Content Studio generation flow actually
 * drives: draft -> finalized (user locks the calendar) -> in_progress
 * (first asset generation started) -> completed (future: all items done).
 */
export type ContentPlanStatus = "draft" | "active" | "finalized" | "in_progress" | "completed" | "archived";

/**
 * A content plan: the top-level container that a strategy (and optionally
 * a specific campaign) is broken down into over a fixed date range.
 */
export interface ContentPlan {
  organizationId: string;
  /** MarketingStrategy._id this plan implements. */
  strategyId: string;
  /** Campaign._id, when this plan supports one specific campaign rather than general/ongoing content. */
  campaignId?: string;
  duration: ContentPlanDuration;
  startDate: Date;
  endDate: Date;
  /** Free-text objectives this plan is meant to satisfy (distinct from the per-item ContentGoal enum). */
  objectives: string[];
  status: ContentPlanStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 9: three independent lifecycle axes, replacing the single
 * `status` field a previous version of this file used to conflate them
 * into (values back then: draft/scheduled/published/archived/planned/
 * brief_ready/generating/generated/approved/failed). Splitting them keeps
 * "has the media finished rendering", "has a human approved this", and
 * "has this actually been scheduled/published" from being crammed into
 * one enum that couldn't represent all three at once - e.g. "approved but
 * regeneration failed" or "changes requested on already-scheduled content"
 * were previously inexpressible.
 *
 * generationStatus: driven entirely by Content Studio's existing
 * generation pipeline (creativeBriefService/graphicGenerationService/
 * videoGenerationService) - unchanged in meaning, `"planned"` replaces the
 * old default `"draft"` value to avoid colliding with approvalStatus's own
 * `"draft"`.
 */
export type ContentGenerationStatus = "planned" | "brief_ready" | "generating" | "generated" | "failed";

/**
 * approvalStatus: the new Phase 9 human-review workflow, owned entirely by
 * ContentLifecycleService - see services/contentStudio/contentLifecycleService.ts.
 * AI (the quality-check service) may only ever drive draft -> review, on a
 * passing quality gate; every other transition requires a human actor.
 */
export type ContentApprovalStatus = "draft" | "review" | "changes_requested" | "approved";

/**
 * publishingStatus: what has actually happened toward getting this content
 * live. "archived" lives here (not as a separate boolean) because it can be
 * reached from three different points (approved/scheduled/published) per
 * the Phase 9 spec's transition table - it is fundamentally about where
 * publishing stands, not a generic flag.
 */
export type ContentPublishingStatus = "unscheduled" | "scheduled" | "published" | "failed" | "archived";

export type ContentPlatform = "instagram";

/**
 * One scheduled piece of content within a ContentPlan. Field names
 * (persona/message/cta) intentionally mirror ContentBrief's semantics
 * (audience/coreMessage/cta) rather than reusing it directly - a
 * ContentItem is the planned/scheduled unit inside a plan, and may exist
 * before a full ContentBrief has been generated for it.
 */
export interface ContentItem {
  /** ContentPlan this item belongs to. */
  contentPlanId: string;
  organizationId: string;
  goal: ContentGoal;
  persona: ContentAudience;
  funnelStage: FunnelStage;
  contentPillar: string;
  topic: string;
  angle: string;
  channel: ContentChannel;
  format: ContentFormat;
  hook: string;
  message: string;
  /** Supporting points backing the core message - carried over from the ContentBrief that produced this item, so Creative Brief generation has real structured content to work from instead of re-deriving it. */
  keyPoints: string[];
  cta: string;
  rationale: string;
  evidence?: ContentEvidenceReference[];
  /** The Content Intelligence-planned calendar date - distinct from `scheduledAt`, the actual approved publish datetime set later by a human via the Schedule action (Phase 9). */
  scheduledDate: Date;

  generationStatus: ContentGenerationStatus;
  approvalStatus: ContentApprovalStatus;
  publishingStatus: ContentPublishingStatus;
  platform: ContentPlatform;

  /** Set only once publishingStatus reaches "scheduled" - the actual publish datetime, always paired with scheduledTimezone. */
  scheduledAt?: Date;
  /** IANA timezone name (e.g. "Asia/Kolkata") the human picked when scheduling - never silently defaulted to UTC. */
  scheduledTimezone?: string;
  /** Set only once publishingStatus reaches "published". */
  publishedAt?: Date;
  /** The publishing provider's own identifier for the live post - never fabricated; absent until a real PublishingProvider reports one. */
  externalPostId?: string;
  /** Name of the PublishingProvider that published this (e.g. "mock", "instagram") - lets the UI/audit trail distinguish a real publish from a MockPublishingProvider run. */
  publishingProvider?: string;

  /** Set on every approve/request-changes/archive action. */
  reviewerId?: string;
  reviewedAt?: Date;
  /** Free-text reviewer note - required when requesting changes, optional on approve/archive. */
  reviewComment?: string;
}
