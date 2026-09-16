import {
  ContentApprovalStatus,
  ContentFormat,
  ContentGenerationStatus,
  ContentGoal,
  ContentItem,
  ContentPlanDuration,
  ContentPlanStatus,
  ContentPublishingStatus,
  FunnelStage,
} from "../api/types";

const GOAL_LABELS: Record<ContentGoal, string> = {
  generate_leads: "Generate Leads",
  increase_awareness: "Increase Awareness",
  launch_product: "Launch Product",
  increase_engagement: "Increase Engagement",
  build_authority: "Build Authority",
  drive_website_traffic: "Drive Website Traffic",
};

const DURATION_LABELS: Record<ContentPlanDuration, string> = {
  "1_week": "7 Days",
  "2_weeks": "14 Days",
  "1_month": "30 Days",
  "3_months": "90 Days",
  "6_months": "180 Days",
  custom: "Custom Range",
};

const FORMAT_LABELS: Record<ContentFormat, string> = {
  instagram_post: "Instagram Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  instagram_story: "Instagram Story",
  instagram_caption: "Instagram Caption",
  blog: "Blog",
  landing_page: "Landing Page",
  email: "Email",
  ad_copy: "Ad Copy",
  ad_creative_brief: "Ad Creative Brief",
};

const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
  retention: "Retention",
};

const PLAN_STATUS_LABELS: Record<ContentPlanStatus, string> = {
  draft: "Draft",
  active: "Active",
  finalized: "Finalized",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const GENERATION_STATUS_LABELS: Record<ContentGenerationStatus, string> = {
  planned: "Planned",
  brief_ready: "Brief Ready",
  generating: "Generating",
  generated: "Generated",
  failed: "Generation Failed",
};

const APPROVAL_STATUS_LABELS: Record<ContentApprovalStatus, string> = {
  draft: "Draft",
  review: "Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

const PUBLISHING_STATUS_LABELS: Record<ContentPublishingStatus, string> = {
  unscheduled: "Unscheduled",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Publishing Failed",
  archived: "Archived",
};

export function goalLabel(goal: ContentGoal): string {
  return GOAL_LABELS[goal] ?? goal;
}

export function durationLabel(duration: ContentPlanDuration): string {
  return DURATION_LABELS[duration] ?? duration;
}

export function formatLabel(format: ContentFormat): string {
  return FORMAT_LABELS[format] ?? format;
}

/** Short label for the calendar card badge - "Instagram Post" -> "Post". */
export function shortFormatLabel(format: ContentFormat): string {
  return format.replace(/^instagram_/, "").replace(/^./, (c) => c.toUpperCase());
}

export function funnelStageLabel(stage: FunnelStage): string {
  return FUNNEL_STAGE_LABELS[stage] ?? stage;
}

export function planStatusLabel(status: ContentPlanStatus): string {
  return PLAN_STATUS_LABELS[status] ?? status;
}

export function generationStatusLabel(status: ContentGenerationStatus): string {
  return GENERATION_STATUS_LABELS[status] ?? status;
}

export function approvalStatusLabel(status: ContentApprovalStatus): string {
  return APPROVAL_STATUS_LABELS[status] ?? status;
}

export function publishingStatusLabel(status: ContentPublishingStatus): string {
  return PUBLISHING_STATUS_LABELS[status] ?? status;
}

export type ContentDisplayStatusKind = "generation" | "approval" | "publishing";

export interface ContentDisplayStatus {
  kind: ContentDisplayStatusKind;
  value: string;
  label: string;
}

/**
 * The single status a calendar card / header badge should show, spanning
 * all three lifecycle axes (see content.types.ts on the backend for why
 * they're separate). Generation takes priority until it completes -
 * approval/publishing are meaningless before there's anything to review.
 * Once generated, publishingStatus takes priority once it moves past
 * "unscheduled" (scheduled/published/failed/archived); otherwise
 * approvalStatus (draft/review/changes_requested/approved) is shown.
 */
export function computeDisplayStatus(item: ContentItem): ContentDisplayStatus {
  if (item.generationStatus !== "generated") {
    return { kind: "generation", value: item.generationStatus, label: generationStatusLabel(item.generationStatus) };
  }
  if (item.publishingStatus !== "unscheduled") {
    return { kind: "publishing", value: item.publishingStatus, label: publishingStatusLabel(item.publishingStatus) };
  }
  return { kind: "approval", value: item.approvalStatus, label: approvalStatusLabel(item.approvalStatus) };
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", options ?? { month: "long", day: "numeric" });
}

export function formatDateShort(value: string): string {
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" });
}
