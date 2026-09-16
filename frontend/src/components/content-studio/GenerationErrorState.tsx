import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { Button } from "../ui/Button";
import { ErrorState } from "../ui/ErrorState";

export function GenerationErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  if (error.status === 409) {
    return (
      <ErrorState
        title="Calendar not finalized"
        message="Finalize your Content Calendar before generating assets."
        action={
          <Link href="/calendar">
            <Button>Go to Calendar</Button>
          </Link>
        }
      />
    );
  }

  if (error.status === 503) {
    return <ErrorState title="Generation unavailable" message={error.message} action={<Button onClick={onRetry}>Try Again</Button>} />;
  }

  if (error.status === 429) {
    return <ErrorState title="Gemini Veo limit reached" message={error.message} action={<Button onClick={onRetry}>Try Again</Button>} />;
  }

  if (error.status === 401 || error.status === 403) {
    return <ErrorState title="Not authorized" message="Please sign in again to continue." />;
  }

  return <ErrorState message={error.message} action={<Button onClick={onRetry}>Try Again</Button>} />;
}
