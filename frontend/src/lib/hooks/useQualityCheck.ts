import { useQuery } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { isApiError } from "../api/errors";
import { queryKeys } from "../query/keys";

/** "No quality check has run yet" (404) is a normal state, not an error - resolves to null, same treatment useCreativeBrief gives a not-yet-generated brief. */
export function useQualityCheck(contentItemId: string | null) {
  return useQuery({
    queryKey: queryKeys.qualityCheck(contentItemId ?? ""),
    queryFn: async () => {
      try {
        const response = await contentStudioApi.getQualityCheck(contentItemId as string);
        return response.data;
      } catch (error) {
        if (isApiError(error) && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(contentItemId),
  });
}
