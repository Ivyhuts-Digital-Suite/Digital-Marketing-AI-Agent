import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-brand">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="max-w-sm text-sm text-foreground-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
