"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquareWarning, Send, Archive as ArchiveIcon, Calendar } from "lucide-react";
import { ContentItem } from "@/lib/api/types";
import { isApiError } from "@/lib/api/errors";
import {
  useApproveContent,
  useArchiveContent,
  useRequestChanges,
  useScheduleContent,
  useSubmitForReview,
} from "@/lib/hooks/useContentStudioMutations";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ApproveConfirmDialog } from "./ApproveConfirmDialog";
import { RequestChangesDialog } from "./RequestChangesDialog";
import { ScheduleContentDialog } from "./ScheduleContentDialog";

interface ReviewActionsPanelProps {
  organizationId: string | null;
  item: ContentItem;
  /** Whether the latest quality check passed - Submit for Review is disabled until it does (mirrors the backend's own gate, so the button's disabled state is never misleading). */
  qualityGatePassed: boolean;
}

/**
 * Phase 9 - Step 5/6/11: the only place in the UI that triggers a lifecycle
 * transition. Every action calls the backend's ContentLifecycleService via
 * its dedicated endpoint - nothing here ever mutates `item` locally.
 */
export function ReviewActionsPanel({ organizationId, item, qualityGatePassed }: ReviewActionsPanelProps) {
  const [dialog, setDialog] = useState<"approve" | "request-changes" | "schedule" | null>(null);

  const submitReview = useSubmitForReview(organizationId, item.contentPlanId, item._id);
  const approve = useApproveContent(organizationId, item.contentPlanId, item._id);
  const requestChanges = useRequestChanges(organizationId, item.contentPlanId, item._id);
  const archive = useArchiveContent(organizationId, item.contentPlanId, item._id);
  const schedule = useScheduleContent(organizationId, item.contentPlanId, item._id);

  const close = () => setDialog(null);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Review Actions</h2>

      {item.generationStatus !== "generated" && (
        <p className="text-sm text-foreground-muted">Content must finish generating before it can be reviewed.</p>
      )}

      {item.generationStatus === "generated" && item.approvalStatus === "draft" && (
        <div className="flex flex-col gap-2">
          <Button onClick={() => submitReview.mutate()} isLoading={submitReview.isPending} disabled={!qualityGatePassed}>
            <Send className="size-4" aria-hidden />
            Submit for Review
          </Button>
          {!qualityGatePassed && <p className="text-xs text-foreground-muted">Run a quality check and pass it before submitting for review.</p>}
          {submitReview.error && <p className="text-sm text-danger">{isApiError(submitReview.error) ? submitReview.error.message : "Failed to submit for review."}</p>}
        </div>
      )}

      {item.approvalStatus === "review" && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog("approve")}>
            <CheckCircle2 className="size-4" aria-hidden />
            Approve
          </Button>
          <Button variant="outline" onClick={() => setDialog("request-changes")}>
            <MessageSquareWarning className="size-4" aria-hidden />
            Request Changes
          </Button>
        </div>
      )}

      {item.approvalStatus === "changes_requested" && (
        <p className="text-sm text-foreground-muted">
          Changes were requested: <span className="text-foreground">&ldquo;{item.reviewComment}&rdquo;</span>. Regenerate the brief or assets above to move this back to Draft.
        </p>
      )}

      {item.approvalStatus === "approved" && item.publishingStatus === "unscheduled" && (
        <Button onClick={() => setDialog("schedule")}>
          <Calendar className="size-4" aria-hidden />
          Schedule Content
        </Button>
      )}

      {item.publishingStatus === "scheduled" && item.scheduledAt && (
        <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
          <p className="font-medium text-foreground">Scheduled for</p>
          <p className="text-foreground-muted">
            {new Date(item.scheduledAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} ({item.scheduledTimezone})
          </p>
        </div>
      )}

      {item.publishingStatus === "published" && (
        <div className="rounded-lg border border-success/40 bg-success-muted p-3 text-sm">
          <p className="font-medium text-foreground">
            Published{item.publishingProvider === "mock" ? " (MOCK - development simulation, not a real Instagram post)" : ""}
          </p>
          {item.publishedAt && <p className="text-foreground-muted">{new Date(item.publishedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>}
        </div>
      )}

      {item.approvalStatus === "approved" && item.publishingStatus !== "archived" && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => archive.mutate(undefined)} isLoading={archive.isPending}>
          <ArchiveIcon className="size-3.5" aria-hidden />
          Archive
        </Button>
      )}

      <ApproveConfirmDialog
        open={dialog === "approve"}
        onClose={close}
        onConfirm={() => approve.mutate({}, { onSuccess: close })}
        isSubmitting={approve.isPending}
        error={approve.error && isApiError(approve.error) ? approve.error.message : null}
      />

      <RequestChangesDialog
        open={dialog === "request-changes"}
        onClose={close}
        onSubmit={(comment) => requestChanges.mutate({ comment }, { onSuccess: close })}
        isSubmitting={requestChanges.isPending}
        error={requestChanges.error && isApiError(requestChanges.error) ? requestChanges.error.message : null}
      />

      <ScheduleContentDialog
        open={dialog === "schedule"}
        onClose={close}
        onSubmit={(input) => schedule.mutate(input, { onSuccess: close })}
        isSubmitting={schedule.isPending}
        error={schedule.error && isApiError(schedule.error) ? schedule.error.message : null}
      />
    </Card>
  );
}
