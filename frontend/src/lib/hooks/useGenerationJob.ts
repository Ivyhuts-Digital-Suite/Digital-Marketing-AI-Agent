import { useQuery } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { queryKeys } from "../query/keys";

const ACTIVE_STATUSES = new Set(["queued", "processing"]);
const POLL_INTERVAL_MS = 2000;

/**
 * Polls GET /api/content-studio/jobs/:jobId only while the job is
 * "queued"/"processing" - stops the instant it lands on completed/failed/
 * cancelled, and never polls at all once we already know it's terminal.
 * Today's providers resolve synchronously (a mutation response already
 * contains a "completed"/"failed" job), so in practice this fires zero
 * extra requests - it exists so an async provider can be dropped in later
 * without changing any UI code.
 */
export function useGenerationJob(jobId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.generationJob(jobId ?? ""),
    queryFn: () => contentStudioApi.getGenerationJob(jobId as string),
    enabled: Boolean(jobId) && (options?.enabled ?? true),
    select: (data) => data.data,
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      return status && ACTIVE_STATUSES.has(status) ? POLL_INTERVAL_MS : false;
    },
  });
}
