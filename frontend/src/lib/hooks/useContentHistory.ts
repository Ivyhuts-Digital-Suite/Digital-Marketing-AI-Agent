import { useQuery } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { queryKeys } from "../query/keys";

export function useContentHistory(contentItemId: string | null) {
  return useQuery({
    queryKey: queryKeys.contentHistory(contentItemId ?? ""),
    queryFn: () => contentStudioApi.getContentHistory(contentItemId as string),
    enabled: Boolean(contentItemId),
    select: (data) => data.data,
  });
}
