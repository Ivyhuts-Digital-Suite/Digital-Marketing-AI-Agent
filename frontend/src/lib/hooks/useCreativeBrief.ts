import { useQuery } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { queryKeys } from "../query/keys";

/**
 * Fetches the persisted Creative Brief for a content item (GET
 * /api/content-studio/briefs/:contentItemId). "No brief generated yet" is
 * real, successful query data (`data === null`), not an error - the
 * backend returns 200 for that case specifically so this never surfaces as
 * `isError`. See useContentAssets for the same pattern.
 */
export function useCreativeBrief(contentItemId: string | null) {
  return useQuery({
    queryKey: queryKeys.creativeBrief(contentItemId ?? ""),
    queryFn: () => contentStudioApi.getCreativeBrief(contentItemId as string),
    enabled: Boolean(contentItemId),
    select: (data) => data.data,
  });
}
