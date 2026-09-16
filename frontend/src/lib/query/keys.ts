/** Centralized query keys so invalidation stays consistent across hooks. */
export const queryKeys = {
  organizations: () => ["organizations"] as const,
  contentPlans: (organizationId: string) => ["content-plans", organizationId] as const,
  contentPlan: (organizationId: string, planId: string) => ["content-plan", organizationId, planId] as const,
  contentAssets: (contentItemId: string) => ["content-assets", contentItemId] as const,
  creativeBrief: (contentItemId: string) => ["creative-brief", contentItemId] as const,
  generationJob: (jobId: string) => ["generation-job", jobId] as const,
};
