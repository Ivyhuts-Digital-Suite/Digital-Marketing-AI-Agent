import { CheckCircle2, Circle, Clock, FileEdit, Loader2, XCircle } from "lucide-react";
import { ContentItemStatus, ContentPlanStatus } from "@/lib/api/types";
import { itemStatusLabel, planStatusLabel } from "@/lib/utils/labels";
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

const ITEM_STATUS_TONE: Record<ContentItemStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "neutral",
  published: "success",
  archived: "neutral",
  planned: "neutral",
  brief_ready: "info",
  generating: "warning",
  generated: "success",
  approved: "success",
  failed: "danger",
};

const ITEM_STATUS_ICON: Partial<Record<ContentItemStatus, typeof Circle>> = {
  generating: Loader2,
  generated: CheckCircle2,
  approved: CheckCircle2,
  failed: XCircle,
  brief_ready: FileEdit,
  scheduled: Clock,
};

export function ItemStatusBadge({ status }: { status: ContentItemStatus }) {
  const Icon = ITEM_STATUS_ICON[status];
  return (
    <Badge tone={ITEM_STATUS_TONE[status]}>
      {Icon && <Icon className={Icon === Loader2 ? "size-3 animate-spin" : "size-3"} aria-hidden />}
      {itemStatusLabel(status)}
    </Badge>
  );
}
