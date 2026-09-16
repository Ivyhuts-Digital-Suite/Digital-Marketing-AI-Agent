import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

const controlClasses =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlClasses, className)} {...props} />
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlClasses, "bg-surface", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";
