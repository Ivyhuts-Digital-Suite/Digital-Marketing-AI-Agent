import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as contentIntelligenceApi from "../api/contentIntelligence";
import { GenerateContentPlanInput } from "../api/types";
import { queryKeys } from "../query/keys";

export function useGenerateContentPlan(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateContentPlanInput) => contentIntelligenceApi.generateContentPlan(input),
    onSuccess: () => {
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.contentPlans(organizationId) });
      }
    },
  });
}

export function useFinalizeContentPlan(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => contentIntelligenceApi.finalizeContentPlan(organizationId as string, planId),
    onSuccess: (_data, planId) => {
      if (!organizationId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.contentPlans(organizationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentPlan(organizationId, planId) });
    },
  });
}
