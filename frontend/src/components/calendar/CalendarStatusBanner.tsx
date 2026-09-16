import { CheckCircle2, ClipboardList, Sparkles } from "lucide-react";
import { ContentPlanStatus } from "@/lib/api/types";
import { Button } from "../ui/Button";

interface CalendarStatusBannerProps {
  status: ContentPlanStatus;
  onFinalize: () => void;
}

export function CalendarStatusBanner({ status, onFinalize }: CalendarStatusBannerProps) {
  if (status === "draft") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Review Your Content Calendar</p>
            <p className="text-sm text-foreground-muted">
              Review each planned item below, then finalize the calendar to unlock content generation.
            </p>
          </div>
        </div>
        <Button onClick={onFinalize} className="shrink-0">
          Finalize Calendar
        </Button>
      </div>
    );
  }

  if (status === "finalized" || status === "in_progress" || status === "completed") {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-success/30 bg-success-muted px-5 py-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">✓ Calendar Finalized — Generation is now available.</p>
          <p className="text-sm text-foreground-muted">
            This calendar now drives AI content generation. Select any item below to open Content Studio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted px-5 py-4">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-foreground-muted" aria-hidden />
      <p className="text-sm text-foreground-muted">This plan is archived and read-only.</p>
    </div>
  );
}
