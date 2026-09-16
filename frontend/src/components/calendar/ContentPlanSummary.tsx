import { CalendarRange, Layers, Send, Target } from "lucide-react";
import { ContentPlan, ContentItem } from "@/lib/api/types";
import { durationLabel } from "@/lib/utils/labels";
import { Card } from "../ui/Card";
import { PlanStatusBadge } from "./StatusBadges";

interface ContentPlanSummaryProps {
  plan: ContentPlan;
  items: ContentItem[];
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof CalendarRange; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-brand">
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function ContentPlanSummary({ plan, items }: ContentPlanSummaryProps) {
  return (
    <Card className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      <SummaryTile icon={CalendarRange} label="Duration" value={durationLabel(plan.duration)} />
      <SummaryTile icon={Target} label="Marketing Goal" value={plan.objectives.join(", ") || "—"} />
      <SummaryTile icon={Layers} label="Content Pieces" value={`${items.length} pieces`} />
      <SummaryTile icon={Send} label="Platform" value="Instagram" />
      <div className="col-span-full flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Plan Status</span>
        <PlanStatusBadge status={plan.status} />
      </div>
    </Card>
  );
}
