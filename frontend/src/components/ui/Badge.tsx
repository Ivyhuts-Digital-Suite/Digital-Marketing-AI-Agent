import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  brand: "bg-brand-muted text-brand",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
  info: "bg-info-muted text-info",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
