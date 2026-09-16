import { ReactNode } from "react";

export function ContentPlanHeader({ actions }: { actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Content Calendar</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Plan, review, and create AI-powered marketing content.
        </p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
