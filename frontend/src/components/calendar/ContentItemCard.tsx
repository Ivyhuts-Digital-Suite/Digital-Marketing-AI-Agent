import { ImageIcon } from "lucide-react";
import { ContentItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils/labels";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { ContentFormatBadge } from "./ContentFormatBadge";
import { ContentLifecycleStatusBadge } from "./StatusBadges";

export function ContentItemCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  // generationStatus only reaches "generated" once every required asset for
  // this item's format actually persisted (see graphicGenerationService.ts/
  // videoGenerationService.ts on the backend) - a reliable proxy for "has
  // assets" without an extra per-card asset fetch for every calendar tile.
  const hasAssets = item.generationStatus === "generated";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      className="flex cursor-pointer flex-col gap-3 p-5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {formatDate(item.scheduledDate)}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge tone="brand" className="uppercase">
            {item.platform}
          </Badge>
          <ContentFormatBadge format={item.format} />
        </div>
      </div>

      <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.topic}</p>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Hook</p>
        <p className="line-clamp-2 text-sm text-foreground-muted">{item.hook}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-foreground-muted">
        <p className="truncate">
          <span className="font-medium text-foreground">Audience:</span> {item.persona.description}
        </p>
        <p className="truncate">
          <span className="font-medium text-foreground">CTA:</span> {item.cta}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="inline-flex items-center gap-1 truncate text-xs text-foreground-muted" title={hasAssets ? "Assets ready" : "No assets generated yet"}>
          <ImageIcon className={hasAssets ? "size-3.5 text-success" : "size-3.5 text-foreground-muted"} aria-hidden />
          {hasAssets ? "Assets ready" : "No assets yet"}
        </span>
        <ContentLifecycleStatusBadge item={item} />
      </div>
    </Card>
  );
}
