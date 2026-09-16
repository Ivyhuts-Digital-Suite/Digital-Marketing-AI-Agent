"use client";

import { ContentFormat, ContentItem } from "@/lib/api/types";
import { computeDisplayStatus } from "@/lib/utils/labels";

export type CalendarStatusFilter =
  | "all"
  | "draft"
  | "review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "archived";

export type CalendarFormatFilter = "all" | "post" | "carousel" | "reel" | "story";
export type CalendarPlatformFilter = "all" | "instagram";
export type CalendarDateRangeFilter = "all" | "this_week" | "this_month" | "custom";

export interface CalendarFilterState {
  status: CalendarStatusFilter;
  format: CalendarFormatFilter;
  platform: CalendarPlatformFilter;
  dateRange: CalendarDateRangeFilter;
  customStart?: string;
  customEnd?: string;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilterState = {
  status: "all",
  format: "all",
  platform: "all",
  dateRange: "all",
};

const FORMAT_FILTER_MAP: Record<Exclude<CalendarFormatFilter, "all">, ContentFormat> = {
  post: "instagram_post",
  carousel: "instagram_carousel",
  reel: "instagram_reel",
  story: "instagram_story",
};

function isWithinDateRange(item: ContentItem, filters: CalendarFilterState): boolean {
  if (filters.dateRange === "all") return true;

  const scheduled = new Date(item.scheduledDate);
  const now = new Date();

  if (filters.dateRange === "this_week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return scheduled >= startOfWeek && scheduled < endOfWeek;
  }

  if (filters.dateRange === "this_month") {
    return scheduled.getFullYear() === now.getFullYear() && scheduled.getMonth() === now.getMonth();
  }

  if (filters.dateRange === "custom") {
    if (filters.customStart && scheduled < new Date(filters.customStart)) return false;
    if (filters.customEnd && scheduled > new Date(filters.customEnd)) return false;
    return true;
  }

  return true;
}

/** Pure filtering function - kept separate from the UI component so it's directly testable. */
export function filterContentItems(items: ContentItem[], filters: CalendarFilterState): ContentItem[] {
  return items.filter((item) => {
    if (filters.status !== "all" && computeDisplayStatus(item).value !== filters.status) {
      return false;
    }

    if (filters.format !== "all" && item.format !== FORMAT_FILTER_MAP[filters.format]) {
      return false;
    }

    if (filters.platform !== "all" && item.platform !== filters.platform) {
      return false;
    }

    if (!isWithinDateRange(item, filters)) {
      return false;
    }

    return true;
  });
}

const SELECT_CLASS =
  "h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function CalendarFilters({ value, onChange }: { value: CalendarFilterState; onChange: (next: CalendarFilterState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as CalendarStatusFilter })}
        aria-label="Filter by status"
      >
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="review">Review</option>
        <option value="changes_requested">Changes Requested</option>
        <option value="approved">Approved</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
        <option value="failed">Failed</option>
        <option value="archived">Archived</option>
      </select>

      <select
        className={SELECT_CLASS}
        value={value.format}
        onChange={(e) => onChange({ ...value, format: e.target.value as CalendarFormatFilter })}
        aria-label="Filter by format"
      >
        <option value="all">All Formats</option>
        <option value="post">Post</option>
        <option value="carousel">Carousel</option>
        <option value="reel">Reel</option>
        <option value="story">Story</option>
      </select>

      <select
        className={SELECT_CLASS}
        value={value.platform}
        onChange={(e) => onChange({ ...value, platform: e.target.value as CalendarPlatformFilter })}
        aria-label="Filter by platform"
      >
        <option value="all">All Platforms</option>
        <option value="instagram">Instagram</option>
      </select>

      <select
        className={SELECT_CLASS}
        value={value.dateRange}
        onChange={(e) => onChange({ ...value, dateRange: e.target.value as CalendarDateRangeFilter })}
        aria-label="Filter by date range"
      >
        <option value="all">All Dates</option>
        <option value="this_week">This Week</option>
        <option value="this_month">This Month</option>
        <option value="custom">Custom Range</option>
      </select>

      {value.dateRange === "custom" && (
        <>
          <input
            type="date"
            className={SELECT_CLASS}
            value={value.customStart ?? ""}
            onChange={(e) => onChange({ ...value, customStart: e.target.value })}
            aria-label="Custom range start"
          />
          <input
            type="date"
            className={SELECT_CLASS}
            value={value.customEnd ?? ""}
            onChange={(e) => onChange({ ...value, customEnd: e.target.value })}
            aria-label="Custom range end"
          />
        </>
      )}
    </div>
  );
}
