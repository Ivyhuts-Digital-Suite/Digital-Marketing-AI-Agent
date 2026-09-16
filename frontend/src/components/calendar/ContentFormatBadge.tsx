import { GalleryHorizontal, Image as ImageIcon, LucideIcon, Video, BookText } from "lucide-react";
import { ContentFormat } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { shortFormatLabel } from "@/lib/utils/labels";

const FORMAT_ICON: Partial<Record<ContentFormat, LucideIcon>> = {
  instagram_post: ImageIcon,
  instagram_carousel: GalleryHorizontal,
  instagram_reel: Video,
  instagram_story: BookText,
};

export function ContentFormatBadge({ format, className }: { format: ContentFormat; className?: string }) {
  const Icon = FORMAT_ICON[format] ?? ImageIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {shortFormatLabel(format)}
    </span>
  );
}
