import { useQuery } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { queryKeys } from "../query/keys";

export function useContentAssets(contentItemId: string | null) {
  return useQuery({
    queryKey: queryKeys.contentAssets(contentItemId ?? ""),
    queryFn: () => contentStudioApi.getContentAssets(contentItemId as string),
    enabled: Boolean(contentItemId),
    select: (data) => data.data,
  });
}
