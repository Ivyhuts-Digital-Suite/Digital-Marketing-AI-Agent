import { ContentItem } from "@/lib/api/types";
import { computeDisplayStatus } from "@/lib/utils/labels";
import { Card } from "../ui/Card";

const BUCKET_ORDER = ["in_progress", "draft", "review", "changes_requested", "approved", "scheduled", "published", "failed", "archived"] as const;

const BUCKET_LABELS: Record<(typeof BUCKET_ORDER)[number], string> = {
  in_progress: "In Progress",
  draft: "Draft",
  review: "In Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  archived: "Archived",
};

/**
 * Phase 9 - Step 19: "Content Operating System Dashboard" - a compact,
 * always-live summary. Counts are derived from the real `items` array on
 * every render (the same computeDisplayStatus every card/badge uses) -
 * never a hardcoded number.
 */
export function ContentPipelineSummary({ items }: { items: ContentItem[] }) {
  const counts = new Map<string, number>(BUCKET_ORDER.map((key) => [key, 0]));

  for (const item of items) {
    const display = computeDisplayStatus(item);
    // Any non-"failed" generation-axis state (planned/brief_ready/generating) counts as "in progress"; a failed generation joins the same FAILED bucket as a failed publish.
    const bucket = display.kind === "generation" && display.value !== "failed" ? "in_progress" : display.value;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Content Pipeline</p>
        <p className="text-lg font-semibold text-foreground">{items.length} Total</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {BUCKET_ORDER.filter((key) => (counts.get(key) ?? 0) > 0).map((key) => (
          <div key={key} className="text-sm">
            <span className="font-semibold text-foreground">{counts.get(key)}</span>{" "}
            <span className="text-foreground-muted">{BUCKET_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
