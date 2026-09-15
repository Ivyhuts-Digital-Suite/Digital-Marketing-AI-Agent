import { Types } from "mongoose";
import { IAnalyticsFinding } from "../../../models/AnalyticsFinding";
import { strategyFeedbackAdapter, ValidatedPerformanceInsight } from "../adapters/strategyFeedbackAdapter";
import { InvalidAnalyticsInputError } from "../errors";

/**
 * Phase 11 - Step 17: Strategy Feedback.
 *
 * Turns a real, already-persisted HIGH_PERFORMANCE/UNDERPERFORMANCE
 * AnalyticsFinding into a ValidatedPerformanceInsight and hands it to the
 * strategyFeedbackAdapter (a clean no-op today - see adapters/). Never
 * mutates any Strategy/ContentPlan/ContentItem document directly: rule
 * #17 is explicit that "Strategy changes must remain versioned/
 * controlled" - only a real Strategy Agent, reading this feedback, should
 * decide to create a new strategy version.
 */
function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

export async function feedValidatedInsight(organizationId: string, finding: IAnalyticsFinding): Promise<void> {
  assertValidOrganizationId(organizationId);

  if (finding.findingType !== "HIGH_PERFORMANCE" && finding.findingType !== "UNDERPERFORMANCE" && finding.findingType !== "TREND") {
    return; // only genuinely actionable, peer-relative or sustained findings are worth feeding back
  }

  const insight: ValidatedPerformanceInsight = {
    organizationId,
    summary: `${finding.findingType} on ${finding.metric} for ${finding.affectedEntity.type} "${finding.affectedEntity.label}" (${finding.changePercent ?? "n/a"}% change vs baseline).`,
    relatedFindingId: finding._id.toString(),
    relatedContentItemId: finding.affectedEntity.type === "content" ? finding.affectedEntity.id : undefined,
    metric: finding.metric,
    changePercent: finding.changePercent,
  };

  await strategyFeedbackAdapter.recordInsight(insight);
}
