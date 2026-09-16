import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as contentStudioApi from "../api/contentStudio";
import { ContentStudioRequest } from "../api/types";
import { queryKeys } from "../query/keys";

/** Invalidates everything that a generation call can change: the item's assets, and the plan (item status + possible finalized -> in_progress transition). */
function useInvalidateAfterGeneration(organizationId: string | null, contentPlanId: string, contentItemId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.contentAssets(contentItemId) });
    if (organizationId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentPlan(organizationId, contentPlanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentPlans(organizationId) });
    }
  };
}

export function useGenerateCreativeBrief(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContentStudioRequest) => contentStudioApi.generateCreativeBrief(input),
    onSuccess: (_data, variables) => {
      // The mutation response is a persisted document, but the UI reads the
      // brief from useCreativeBrief (GET) as the source of truth - refetch
      // it rather than trusting this response directly.
      queryClient.invalidateQueries({ queryKey: queryKeys.creativeBrief(variables.contentItemId) });
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.contentPlan(organizationId, variables.contentPlanId) });
      }
    },
  });
}

export function useGenerateGraphic(organizationId: string | null, input: ContentStudioRequest) {
  const invalidate = useInvalidateAfterGeneration(organizationId, input.contentPlanId, input.contentItemId);

  return useMutation({
    mutationFn: () => contentStudioApi.generateGraphic(input),
    onSuccess: invalidate,
  });
}

export function useGenerateVideo(organizationId: string | null, input: ContentStudioRequest) {
  const invalidate = useInvalidateAfterGeneration(organizationId, input.contentPlanId, input.contentItemId);

  return useMutation({
    mutationFn: () => contentStudioApi.generateVideo(input),
    onSuccess: invalidate,
  });
}
