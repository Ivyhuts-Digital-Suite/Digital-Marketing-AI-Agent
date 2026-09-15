import { Types } from "mongoose";
import AnalyticsFinding, { IAnalyticsFinding } from "../../../models/AnalyticsFinding";
import AnalyticsReport from "../../../models/AnalyticsReport";
import { AnalyticsDatabaseError, FindingNotFoundError, InvalidAnalyticsInputError } from "../errors";
import { requestAnalyticsInterpretation } from "./analyticsAgentLlm";

/**
 * Phase 11 - Step 9: Analytics Agent orchestrator.
 *
 * Loads already-persisted AnalyticsFinding documents (never computes one
 * itself - that's the deterministic engine's job), asks the LLM to
 * interpret each, and persists the result as an AnalyticsReport.
 */
function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

export async function interpretFindings(organizationId: string, findingIds: string[]): Promise<IAnalyticsFinding[]> {
  assertValidOrganizationId(organizationId);
  if (findingIds.some((id) => !Types.ObjectId.isValid(id))) {
    throw new InvalidAnalyticsInputError("one or more findingIds are invalid");
  }

  let findings: IAnalyticsFinding[];
  try {
    findings = await AnalyticsFinding.find({ organizationId, _id: { $in: findingIds } });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load findings: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (findings.length !== findingIds.length) {
    const foundIds = new Set(findings.map((f) => f._id.toString()));
    const missing = findingIds.find((id) => !foundIds.has(id));
    if (missing) throw new FindingNotFoundError(missing);
  }

  const entries = [];
  for (const finding of findings) {
    const interpretation = await requestAnalyticsInterpretation(finding);
    entries.push({
      findingId: finding._id,
      interpretation: interpretation.interpretation,
      possibleCauses: interpretation.possibleCauses,
      businessImpact: interpretation.businessImpact,
    });
  }

  const periodStart = findings.reduce((min, f) => (f.periodStart < min ? f.periodStart : min), findings[0].periodStart);
  const periodEnd = findings.reduce((max, f) => (f.periodEnd > max ? f.periodEnd : max), findings[0].periodEnd);

  try {
    await AnalyticsReport.create({ organizationId, periodStart, periodEnd, entries, generatedAt: new Date() });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist analytics report: ${error instanceof Error ? error.message : String(error)}`);
  }

  return findings;
}
