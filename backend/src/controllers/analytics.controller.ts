import { Request, Response } from "express";
import * as analyticsService from "../services/analytics/analyticsService";
import { AnalyticsDatabaseError, FindingNotFoundError, InvalidAnalyticsInputError } from "../services/analytics/errors";

/**
 * Phase 11 - Step 18/19: Analytics API.
 *
 * SECURITY NOTE (documented, not silently assumed - see Step 19 of the
 * Phase 11 spec): this codebase has no Organization membership model yet
 * (same gap already documented on companyIntelligence.controller.ts and
 * contentIntelligence.controller.ts). `authenticate` proves the caller is
 * a valid logged-in user; it cannot yet prove they belong to :orgId. Every
 * query below IS scoped by organizationId (so org A's data is never
 * mixed with org B's), but the endpoint cannot yet reject "org A's user
 * asking for org B's id". Add a real membership check here once an
 * Organization/membership model exists.
 */
function handleError(error: unknown, res: Response): void {
  if (error instanceof InvalidAnalyticsInputError) {
    res.status(400).json({ message: error.message });
    return;
  }
  if (error instanceof FindingNotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }
  if (error instanceof AnalyticsDatabaseError) {
    console.error("Analytics Database Error:", error.message);
    res.status(500).json({ message: "Server error" });
    return;
  }
  console.error("Analytics Unexpected Error:", error);
  res.status(500).json({ message: "Server error" });
}

/** Express 5's req.params values type as `string | string[]`; a route param is always a single string in practice. */
function requireParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new InvalidAnalyticsInputError(`${name} is required`);
  }
  return value;
}

function parsePeriod(req: Request): { periodStart: Date; periodEnd: Date } {
  const periodStart =
    typeof req.query.periodStart === "string" ? new Date(req.query.periodStart) : new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const periodEnd = typeof req.query.periodEnd === "string" ? new Date(req.query.periodEnd) : new Date();
  return { periodStart, periodEnd };
}

/** GET /api/analytics/overview/:orgId */
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const { periodStart, periodEnd } = parsePeriod(req);
    const overview = await analyticsService.getOverview(orgId, periodStart, periodEnd);
    res.status(200).json(overview);
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/analytics/metrics/:orgId */
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const { periodStart, periodEnd } = parsePeriod(req);
    const metrics = await analyticsService.getMetrics(orgId, {
      metric: typeof req.query.metric === "string" ? (req.query.metric as never) : undefined,
      periodStart,
      periodEnd,
    });
    res.status(200).json({ metrics });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/analytics/metrics/:orgId/content/:contentItemId */
export const getMetricsForContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const contentItemId = requireParam(req.params.contentItemId, "contentItemId");
    const { periodStart, periodEnd } = parsePeriod(req);
    const metrics = await analyticsService.getMetrics(orgId, { contentItemId, periodStart, periodEnd });
    res.status(200).json({ metrics });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/analytics/metrics/:orgId/campaign/:campaignId */
export const getMetricsForCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const campaignId = requireParam(req.params.campaignId, "campaignId");
    const { periodStart, periodEnd } = parsePeriod(req);
    const metrics = await analyticsService.getMetrics(orgId, { campaignId, periodStart, periodEnd });
    res.status(200).json({ metrics });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/analytics/findings/:orgId */
export const listFindings = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const findings = await analyticsService.listFindings(orgId);
    res.status(200).json({ findings });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/analytics/findings/:orgId/:findingId */
export const getFinding = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const findingId = requireParam(req.params.findingId, "findingId");
    const finding = await analyticsService.getFinding(orgId, findingId);
    res.status(200).json({ finding });
  } catch (error) {
    handleError(error, res);
  }
};
