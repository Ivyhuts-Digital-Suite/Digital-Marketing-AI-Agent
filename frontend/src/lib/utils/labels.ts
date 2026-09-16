import {
  ContentFormat,
  ContentGoal,
  ContentItemStatus,
  ContentPlanDuration,
  ContentPlanStatus,
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

const ITEM_STATUS_LABELS: Record<ContentItemStatus, string> = {
  draft: "Planned",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
  planned: "Planned",
  brief_ready: "Brief Ready",
  generating: "Generating",
  generated: "Generated",
  approved: "Approved",
  failed: "Failed",
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

export function itemStatusLabel(status: ContentItemStatus): string {
  return ITEM_STATUS_LABELS[status] ?? status;
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", options ?? { month: "long", day: "numeric" });
}

export function formatDateShort(value: string): string {
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" });
}
