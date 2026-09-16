"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarPlus, LayoutGrid } from "lucide-react";
import { useOrganization } from "@/lib/organization/OrganizationContext";
import { useContentPlans } from "@/lib/hooks/useContentPlans";
import { useContentPlan } from "@/lib/hooks/useContentPlan";
import { useFinalizeContentPlan, useGenerateContentPlan } from "@/lib/hooks/useContentPlanMutations";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CalendarSkeleton } from "@/components/calendar/CalendarSkeleton";
import { CalendarStatusBanner } from "@/components/calendar/CalendarStatusBanner";
import { CalendarFilters, DEFAULT_CALENDAR_FILTERS, filterContentItems, CalendarFilterState } from "@/components/calendar/CalendarFilters";
import { ContentCalendarGrid } from "@/components/calendar/ContentCalendarGrid";
import { ContentPipelineSummary } from "@/components/calendar/ContentPipelineSummary";
import { ContentPlanHeader } from "@/components/calendar/ContentPlanHeader";
import { ContentPlanSelector } from "@/components/calendar/ContentPlanSelector";
import { ContentPlanSummary } from "@/components/calendar/ContentPlanSummary";
import { FinalizeCalendarDialog } from "@/components/calendar/FinalizeCalendarDialog";
import { GenerateContentPlanDialog, GenerateContentPlanFormValues } from "@/components/calendar/GenerateContentPlanDialog";

export default function CalendarPage() {
  const { organizationId } = useOrganization();
  const router = useRouter();

  const plansQuery = useContentPlans(organizationId);
  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);

  const [explicitPlanId, setExplicitPlanId] = useState<string | null>(null);
  // Default to the most recently created plan until the user picks a different one from the selector.
  const selectedPlanId = explicitPlanId ?? plans[0]?._id ?? null;

  const planQuery = useContentPlan(organizationId, selectedPlanId);

  const generateMutation = useGenerateContentPlan(organizationId);
  const finalizeMutation = useFinalizeContentPlan(organizationId);

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilterState>(DEFAULT_CALENDAR_FILTERS);

  async function handleGenerate(values: GenerateContentPlanFormValues) {
    if (!organizationId) return;
    try {
      const response = await generateMutation.mutateAsync({ organizationId, ...values });
      setExplicitPlanId(response.result.contentPlanId);
      setIsGenerateOpen(false);
    } catch {
      // error surfaced inline via generateMutation.error below
    }
  }

  async function handleFinalize() {
    if (!selectedPlanId) return;
    await finalizeMutation.mutateAsync(selectedPlanId);
    setIsFinalizeOpen(false);
  }

  if (plansQuery.isLoading) {
    return <CalendarSkeleton />;
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        message={isApiError(plansQuery.error) ? plansQuery.error.message : "Failed to load content plans."}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <ContentPlanHeader />
        <EmptyState
          icon={LayoutGrid}
          title="No content plan yet"
          description="Generate a content calendar to start planning AI-powered Instagram content grounded in your company knowledge and strategy."
          action={
            <Button onClick={() => setIsGenerateOpen(true)}>
              <CalendarPlus className="size-4" aria-hidden />
              Generate Content Plan
            </Button>
          }
        />
        <GenerateContentPlanDialog
          open={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          onSubmit={handleGenerate}
          isSubmitting={generateMutation.isPending}
          error={generateMutation.error && isApiError(generateMutation.error) ? generateMutation.error.message : null}
        />
      </div>
    );
  }

  const plan = planQuery.data?.plan;
  const items = planQuery.data?.items ?? [];
  const canFinalize = plan?.status === "draft";
  const filteredItems = filterContentItems(items, filters);

  return (
    <div className="flex flex-col gap-6">
      <ContentPlanHeader
        actions={
          <>
            <ContentPlanSelector plans={plans} selectedPlanId={selectedPlanId ?? ""} onSelect={setExplicitPlanId} />
            <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
              <CalendarPlus className="size-4" aria-hidden />
              Generate Content Plan
            </Button>
            {plan && (
              <Button onClick={() => setIsFinalizeOpen(true)} disabled={!canFinalize}>
                Finalize Calendar
              </Button>
            )}
          </>
        }
      />

      {planQuery.isLoading && <CalendarSkeleton />}

      {planQuery.isError && (
        <ErrorState message={isApiError(planQuery.error) ? planQuery.error.message : "Failed to load this content plan."} />
      )}

      {plan && (
        <>
          <ContentPlanSummary plan={plan} items={items} />
          <ContentPipelineSummary items={items} />
          <CalendarStatusBanner status={plan.status} onFinalize={() => setIsFinalizeOpen(true)} />
          <CalendarFilters value={filters} onChange={setFilters} />
          <ContentCalendarGrid
            items={filteredItems}
            onSelectItem={(item) => router.push(`/content-studio/${item._id}?planId=${plan._id}`)}
          />
        </>
      )}

      <GenerateContentPlanDialog
        open={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSubmit={handleGenerate}
        isSubmitting={generateMutation.isPending}
        error={generateMutation.error && isApiError(generateMutation.error) ? generateMutation.error.message : null}
      />

      <FinalizeCalendarDialog
        open={isFinalizeOpen}
        onClose={() => setIsFinalizeOpen(false)}
        onConfirm={handleFinalize}
        isSubmitting={finalizeMutation.isPending}
      />
    </div>
  );
}
