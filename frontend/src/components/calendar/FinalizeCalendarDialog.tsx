import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";

interface FinalizeCalendarDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function FinalizeCalendarDialog({ open, onClose, onConfirm, isSubmitting }: FinalizeCalendarDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Finalize Calendar"
      description="Once finalized, this content calendar will become the source of truth for your content generation workflow."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} isLoading={isSubmitting}>
            Finalize Calendar
          </Button>
        </>
      }
    />
  );
}
