import { FormEvent, useState } from "react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field } from "../ui/Field";

interface RequestChangesDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  isSubmitting: boolean;
  error?: string | null;
}

const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/** Phase 9 - Step 15: a comment is mandatory - the form cannot submit without one. */
export function RequestChangesDialog({ open, onClose, onSubmit, isSubmitting, error }: RequestChangesDialogProps) {
  const [comment, setComment] = useState("");
  const trimmed = comment.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Request Changes" description="Tell the team what should change before this content can move forward.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="What should be changed?" htmlFor="change-request-comment" error={comment.length > 0 && !trimmed ? "A comment is required." : undefined}>
          <textarea
            id="change-request-comment"
            className={TEXTAREA_CLASS}
            placeholder="Make the hook more direct and reduce the amount of text on slide 2."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting} disabled={!trimmed}>
            Request Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
