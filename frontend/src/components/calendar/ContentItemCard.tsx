import { ContentItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils/labels";
import { Card } from "../ui/Card";
import { ContentFormatBadge } from "./ContentFormatBadge";
import { ItemStatusBadge } from "./StatusBadges";

export function ContentItemCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
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
        <ContentFormatBadge format={item.format} />
      </div>

      <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.topic}</p>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Hook</p>
        <p className="line-clamp-2 text-sm text-foreground-muted">{item.hook}</p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="truncate text-xs text-foreground-muted">{item.contentPillar}</span>
        <ItemStatusBadge status={item.status} />
      </div>
    </Card>
  );
}
