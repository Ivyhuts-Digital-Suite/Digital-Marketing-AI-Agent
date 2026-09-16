import { CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";

export function AssetActionsBar({ onRegenerate, isRegenerating }: { onRegenerate: () => void; isRegenerating: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRegenerate} isLoading={isRegenerating}>
        <RefreshCw className="size-3.5" aria-hidden />
        Regenerate Video
      </Button>
      <Button variant="outline" size="sm" disabled title="Approval workflow is not available yet">
        <CheckCircle2 className="size-3.5" aria-hidden />
        Approve
        <span className="ml-1 text-xs text-foreground-muted">(Coming soon)</span>
      </Button>
    </div>
  );
}
