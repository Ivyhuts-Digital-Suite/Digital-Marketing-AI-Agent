import { useQuery } from "@tanstack/react-query";
import * as contentIntelligenceApi from "../api/contentIntelligence";
import { queryKeys } from "../query/keys";

export function useContentPlans(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.contentPlans(organizationId ?? ""),
    queryFn: () => contentIntelligenceApi.getContentPlans(organizationId as string),
    enabled: Boolean(organizationId),
    select: (data) => data.plans,
  });
}
