import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContentItem } from "@/lib/api/types";
import { ContentFormatBadge } from "../calendar/ContentFormatBadge";
import { ItemStatusBadge } from "../calendar/StatusBadges";

export function ContentStudioHeader({ item }: { item: ContentItem }) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/calendar" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-foreground-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Content Calendar
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <ContentFormatBadge format={item.format} />
        <ItemStatusBadge status={item.status} />
      </div>

      <h1 className="text-2xl font-semibold text-foreground">{item.topic}</h1>
    </div>
  );
}
