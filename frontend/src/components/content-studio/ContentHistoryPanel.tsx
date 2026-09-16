import { ContentLifecycleHistoryEntry } from "@/lib/api/types";
import { Card } from "../ui/Card";

const ACTOR_LABELS: Record<string, string> = { AI: "AI", USER: "User", SYSTEM: "System" };

/** Phase 9 - Step 6: the audit trail - "why was this content changed?" made visible. Read-only; nothing here can mutate history. */
export function ContentHistoryPanel({ entries, isLoading }: { entries: ContentLifecycleHistoryEntry[] | undefined; isLoading: boolean }) {
  if (isLoading) return null;
  if (!entries || entries.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">History</h2>
      <ol className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry._id} className="flex flex-col gap-0.5 border-l-2 border-border pl-3 text-sm">
            <p className="text-foreground">
              <span className="font-medium">{ACTOR_LABELS[entry.actorType] ?? entry.actorType}</span>
              {entry.actorLabel ? ` (${entry.actorLabel})` : ""}: {entry.fromStatus} &rarr; {entry.toStatus}
              <span className="ml-2 text-xs text-foreground-muted">[{entry.statusField}]</span>
            </p>
            {entry.comment && <p className="text-xs text-foreground-muted">&ldquo;{entry.comment}&rdquo;</p>}
            <p className="text-xs text-foreground-muted">{new Date(entry.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
