import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as organizationsApi from "../api/organizations";
import { CreateOrganizationInput } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../query/keys";

/** Every organization the authenticated user belongs to. Only fetches once auth has resolved, so it never fires while a token is still being verified. */
export function useOrganizations() {
  const { status } = useAuth();

  return useQuery({
    queryKey: queryKeys.organizations(),
    queryFn: () => organizationsApi.getOrganizations(),
    enabled: status === "authenticated",
    select: (data) => data.data,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationsApi.createOrganization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations() });
    },
  });
}
