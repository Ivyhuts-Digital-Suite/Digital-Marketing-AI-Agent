"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useOrganization } from "@/lib/organization/OrganizationContext";
import { useContentPlan } from "@/lib/hooks/useContentPlan";
import { useContentAssets } from "@/lib/hooks/useContentAssets";
import { useContentHistory } from "@/lib/hooks/useContentHistory";
import { useCreativeBrief } from "@/lib/hooks/useCreativeBrief";
import { useQualityCheck } from "@/lib/hooks/useQualityCheck";
import {
  useGenerateCreativeBrief,
  useGenerateGraphic,
  useGenerateVideo,
  useRunQualityCheck,
} from "@/lib/hooks/useContentStudioMutations";
import { useGenerationJob } from "@/lib/hooks/useGenerationJob";
import { ApiError, isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContentHistoryPanel } from "@/components/content-studio/ContentHistoryPanel";
import { ContentMessagePanel } from "@/components/content-studio/ContentMessagePanel";
import { ContentStrategyPanel } from "@/components/content-studio/ContentStrategyPanel";
import { ContentStudioHeader } from "@/components/content-studio/ContentStudioHeader";
import { CreativeBriefPanel } from "@/components/content-studio/CreativeBriefPanel";
import { GraphicGenerationPanel } from "@/components/content-studio/GraphicGenerationPanel";
import { QualityReportPanel } from "@/components/content-studio/QualityReportPanel";
import { ReviewActionsPanel } from "@/components/content-studio/ReviewActionsPanel";
import { VideoGenerationPanel } from "@/components/content-studio/VideoGenerationPanel";

const PLAN_READY_STATUSES = new Set(["finalized", "in_progress"]);

export default function ContentStudioPage() {
  const params = useParams<{ contentItemId: string }>();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const contentItemId = params.contentItemId;

  const { organizationId } = useOrganization();
  const planQuery = useContentPlan(organizationId, planId);
  const { refetch: refetchPlan } = planQuery;
  const { data: contentAssets, refetch: refetchContentAssets } = useContentAssets(contentItemId);
  const briefQuery = useCreativeBrief(contentItemId);
  const qualityCheckQuery = useQualityCheck(contentItemId);
  const historyQuery = useContentHistory(contentItemId);

  const item = useMemo(
    () => planQuery.data?.items.find((candidate) => candidate._id === contentItemId),
    [planQuery.data, contentItemId]
  );

  const briefInput = { contentPlanId: planId ?? "", contentItemId };
  const briefMutation = useGenerateCreativeBrief(organizationId);
  const graphicMutation = useGenerateGraphic(organizationId, briefInput);
  const videoMutation = useGenerateVideo(organizationId, briefInput);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const videoJobQuery = useGenerationJob(videoJobId);
  const runQualityCheckMutation = useRunQualityCheck(organizationId, planId ?? "", contentItemId);

  useEffect(() => {
    if (videoJobQuery.data?.status === "completed") {
      void Promise.all([refetchContentAssets(), refetchPlan()]).finally(() => setVideoJobId(null));
    }
  }, [refetchContentAssets, refetchPlan, videoJobQuery.data?.status]);

  if (!planId) {
    return (
      <ErrorState
        title="Missing content plan"
        message="Open this content item from the Content Calendar so we know which plan it belongs to."
        action={
          <Link href="/calendar">
            <Button>Go to Calendar</Button>
          </Link>
        }
      />
    );
  }

  if (planQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (planQuery.isError) {
    return <ErrorState message={isApiError(planQuery.error) ? planQuery.error.message : "Failed to load this content plan."} />;
  }

  if (!item) {
    return (
      <ErrorState
        title="Content item not found"
        message="This content item could not be found in the selected plan."
        action={
          <Link href="/calendar">
            <Button>Go to Calendar</Button>
          </Link>
        }
      />
    );
  }

  const plan = planQuery.data?.plan;
  const assets = contentAssets ?? [];
  const graphicAssets = assets.filter((asset) => asset.type === "graphic" || asset.type === "image");
  const videoAssets = assets.filter((asset) => asset.type === "video");

  // Generation availability is derived from real, persisted state - plan
  // status (from the DB), Creative Brief existence (from the DB via GET
  // /briefs/:contentItemId), and the item's own status - never from
  // temporary mutation state that resets on reload.
  const isPlanReady = Boolean(plan && PLAN_READY_STATUSES.has(plan.status));
  const hasBrief = Boolean(briefQuery.data);
  const isGraphicFormat = item.format === "instagram_post" || item.format === "instagram_carousel" || item.format === "instagram_story";
  const isReelFormat = item.format === "instagram_reel";

  return (
    <div className="flex flex-col gap-6">
      <ContentStudioHeader item={item} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ContentStrategyPanel item={item} />
        <ContentMessagePanel item={item} />
      </div>

      <CreativeBriefPanel
        brief={briefQuery.data}
        isLoadingBrief={briefQuery.isLoading}
        isGenerating={briefMutation.isPending}
        generationError={briefMutation.error && isApiError(briefMutation.error) ? briefMutation.error : null}
        onGenerate={() => briefMutation.mutate(briefInput)}
      />

      {isGraphicFormat && (
        <GraphicGenerationPanel
          assets={graphicAssets}
          isPlanReady={isPlanReady}
          hasBrief={hasBrief}
          isPending={graphicMutation.isPending}
          error={graphicMutation.error && isApiError(graphicMutation.error) ? graphicMutation.error : null}
          onGenerate={() => graphicMutation.mutate()}
        />
      )}

      {isReelFormat && (
        <VideoGenerationPanel
          assets={videoAssets}
          isPlanReady={isPlanReady}
          hasBrief={hasBrief}
          isPending={videoMutation.isPending || videoJobQuery.data?.status === "queued" || videoJobQuery.data?.status === "processing"}
          error={
            videoMutation.error && isApiError(videoMutation.error)
              ? videoMutation.error
              : videoJobQuery.data?.status === "failed"
              ? new ApiError(videoJobQuery.data.error ?? "Video generation failed.", 502)
              : null
          }
          onGenerate={() =>
            videoMutation.mutate(undefined, {
              onSuccess: (response) => setVideoJobId(response.data.job._id),
            })
          }
        />
      )}

      <QualityReportPanel
        check={qualityCheckQuery.data}
        isLoading={qualityCheckQuery.isLoading}
        canRunCheck={item.generationStatus === "generated"}
        isRunning={runQualityCheckMutation.isPending}
        error={runQualityCheckMutation.error && isApiError(runQualityCheckMutation.error) ? runQualityCheckMutation.error : null}
        onRunCheck={() => runQualityCheckMutation.mutate()}
      />

      <ReviewActionsPanel organizationId={organizationId} item={item} qualityGatePassed={qualityCheckQuery.data?.status === "PASS"} />

      <ContentHistoryPanel entries={historyQuery.data} isLoading={historyQuery.isLoading} />
    </div>
  );
}
