import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface ApproveConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function ApproveConfirmDialog({ open, onClose, onConfirm, isSubmitting, error }: ApproveConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Approve this content?"
      description="Once approved, this content can be scheduled for publishing."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} isLoading={isSubmitting}>
            Approve Content
          </Button>
        </>
      }
    >
      {error && <p className="text-sm text-danger">{error}</p>}
    </Dialog>
  );
}
