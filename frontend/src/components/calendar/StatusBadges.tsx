import { AlertTriangle, Archive, CheckCircle2, Circle, Clock, FileEdit, Loader2, MessageSquareWarning, Send, XCircle } from "lucide-react";
import { ContentItem, ContentPlanStatus } from "@/lib/api/types";
import { computeDisplayStatus, planStatusLabel } from "@/lib/utils/labels";
import { Badge, BadgeTone } from "../ui/Badge";

const PLAN_STATUS_TONE: Record<ContentPlanStatus, BadgeTone> = {
  draft: "neutral",
  active: "info",
  finalized: "info",
  in_progress: "warning",
  completed: "success",
  archived: "neutral",
};

export function PlanStatusBadge({ status }: { status: ContentPlanStatus }) {
  return <Badge tone={PLAN_STATUS_TONE[status]}>{planStatusLabel(status)}</Badge>;
}

/** Tone/icon per DISPLAY STATUS VALUE, spanning all three lifecycle axes - see computeDisplayStatus. Professional icon system (lucide-react), no emoji, per the Phase 9 spec. */
const DISPLAY_STATUS_TONE: Record<string, BadgeTone> = {
  // generationStatus
  planned: "neutral",
  brief_ready: "info",
  generating: "warning",
  failed: "danger",
  // approvalStatus
  draft: "neutral",
  review: "info",
  changes_requested: "warning",
  approved: "success",
  // publishingStatus
  scheduled: "info",
  published: "success",
  archived: "neutral",
};

const DISPLAY_STATUS_ICON: Record<string, typeof Circle> = {
  generating: Loader2,
  failed: XCircle,
  brief_ready: FileEdit,
  review: Clock,
  changes_requested: MessageSquareWarning,
  approved: CheckCircle2,
  scheduled: Send,
  published: CheckCircle2,
  archived: Archive,
};

/**
 * The one status badge every surface (calendar card, Content Studio
 * header) should use - computes which of the three lifecycle axes is
 * currently the meaningful one for this item (see labels.ts::computeDisplayStatus)
 * rather than requiring callers to pick an axis themselves.
 */
export function ContentLifecycleStatusBadge({ item }: { item: ContentItem }) {
  const display = computeDisplayStatus(item);
  const Icon = DISPLAY_STATUS_ICON[display.value];
  const tone = DISPLAY_STATUS_TONE[display.value] ?? "neutral";

  return (
    <Badge tone={tone}>
      {Icon && <Icon className={Icon === Loader2 ? "size-3 animate-spin" : "size-3"} aria-hidden />}
      {display.label}
    </Badge>
  );
}

/** Publishing-failure and generation-failure both render with a distinct warning icon when shown standalone (e.g. filters) - exported for reuse outside the combined badge. */
export function statusIconFor(value: string): typeof Circle | undefined {
  return DISPLAY_STATUS_ICON[value] ?? (value === "failed" ? AlertTriangle : undefined);
}
