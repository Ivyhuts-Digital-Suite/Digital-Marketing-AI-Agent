import { useQuery } from "@tanstack/react-query";
import * as contentIntelligenceApi from "../api/contentIntelligence";
import { queryKeys } from "../query/keys";

export function useContentPlan(organizationId: string | null, planId: string | null) {
  return useQuery({
    queryKey: queryKeys.contentPlan(organizationId ?? "", planId ?? ""),
    queryFn: () => contentIntelligenceApi.getContentPlan(organizationId as string, planId as string),
    enabled: Boolean(organizationId) && Boolean(planId),
  });
}
