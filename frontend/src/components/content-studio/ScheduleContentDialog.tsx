import { FormEvent, useState } from "react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input } from "../ui/Field";

interface ScheduleContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { scheduledAt: string; scheduledTimezone: string }) => void;
  isSubmitting: boolean;
  error?: string | null;
}

/** Never silently assumes UTC - defaults to the browser's own detected IANA timezone, which the user can still override. */
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function ScheduleContentDialog({ open, onClose, onSubmit, isSubmitting, error }: ScheduleContentDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState(detectTimezone);
  const [pastDateError, setPastDateError] = useState(false);

  // Pure at render time - no Date.now() call here (React's purity rule
  // flags that). The future-date check only ever runs inside the submit
  // handler below, where an impure check is fine.
  const combinedIso = date && time ? new Date(`${date}T${time}`).toISOString() : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!combinedIso || !timezone.trim()) return;
    if (new Date(combinedIso).getTime() <= Date.now()) {
      setPastDateError(true);
      return;
    }
    setPastDateError(false);
    onSubmit({ scheduledAt: combinedIso, scheduledTimezone: timezone.trim() });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Schedule Content" description="Choose when this content should be published.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="schedule-date">
            <Input id="schedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Time" htmlFor="schedule-time">
            <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </Field>
        </div>

        <Field label="Timezone" htmlFor="schedule-timezone" error={!timezone.trim() ? "A timezone is required." : undefined}>
          <Input
            id="schedule-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. Asia/Kolkata"
            required
          />
        </Field>

        {pastDateError && <p className="text-sm text-danger">Scheduled time must be in the future.</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!combinedIso || !timezone.trim()}>
            Schedule Content
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
