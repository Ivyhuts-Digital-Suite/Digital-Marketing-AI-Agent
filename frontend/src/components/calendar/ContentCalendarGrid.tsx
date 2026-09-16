import { ContentItem } from "@/lib/api/types";
import { EmptyState } from "../ui/EmptyState";
import { CalendarDays } from "lucide-react";
import { ContentItemCard } from "./ContentItemCard";

export function ContentCalendarGrid({ items, onSelectItem }: { items: ContentItem[]; onSelectItem: (item: ContentItem) => void }) {
  if (items.length === 0) {
    return <EmptyState icon={CalendarDays} title="No content items yet" description="This plan doesn't have any scheduled content." />;
  }

  const sorted = [...items].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((item) => (
        <ContentItemCard key={item._id} item={item} onClick={() => onSelectItem(item)} />
      ))}
    </div>
  );
}
