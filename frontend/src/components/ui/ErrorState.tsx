import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, action, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-danger/20 bg-danger-muted px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-white text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-md text-sm text-foreground-muted">{message}</p>
      </div>
      {action}
    </div>
  );
}
