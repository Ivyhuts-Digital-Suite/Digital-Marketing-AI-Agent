import { RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";

/**
 * Phase 9: the "Approve (Coming soon)" stub that used to live here has been
 * replaced by the real approval workflow in ReviewActionsPanel.tsx, at the
 * content-item level (not per-asset) - approving a single generated asset
 * in isolation isn't meaningful when review/approval now applies to the
 * whole content package (brief + assets together).
 */
export function AssetActionsBar({ onRegenerate, isRegenerating }: { onRegenerate: () => void; isRegenerating: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRegenerate} isLoading={isRegenerating}>
        <RefreshCw className="size-3.5" aria-hidden />
        Regenerate Video
      </Button>
    </div>
  );
}
