import { Request, Response } from "express";
import { companyIntelligenceService } from "../services/companyIntelligence/companyIntelligenceService";
import {
  InvalidOrganizationIdError,
  NoCompanyKnowledgeError,
  CompanyIntelligenceConfigurationError,
  LlmRequestError,
  InvalidLlmResponseError,
  CompanyIntelligenceDatabaseError,
} from "../services/companyIntelligence/errors";

/**
 * POST /api/company-intelligence/generate
 *
 * Note: this codebase does not yet model which organization(s) a user
 * belongs to (User has no organizationId field), so this endpoint can
 * only verify that the caller is authenticated - it cannot yet verify
 * that the caller belongs to the given organizationId. That membership
 * check should be added here once organization membership exists.
 */
export const generateCompanyIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.body;

    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }

    const result = await companyIntelligenceService.generateForOrganization(organizationId);

    res.status(200).json({
      message: "Company intelligence generated successfully",
      result,
    });
  } catch (error) {
    if (error instanceof InvalidOrganizationIdError) {
      res.status(400).json({ message: error.message });
      return;
    }

    if (error instanceof NoCompanyKnowledgeError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof CompanyIntelligenceConfigurationError) {
      console.error("Company Intelligence Configuration Error:", error.message);
      res.status(503).json({ message: "Company intelligence generation is not available right now" });
      return;
    }

    if (error instanceof LlmRequestError || error instanceof InvalidLlmResponseError) {
      console.error("Company Intelligence LLM Error:", error.message);
      res.status(502).json({ message: "Company intelligence generation failed upstream, please try again" });
      return;
    }

    if (error instanceof CompanyIntelligenceDatabaseError) {
      console.error("Company Intelligence Database Error:", error.message);
      res.status(500).json({ message: "Server error" });
      return;
    }

    console.error("Company Intelligence Unexpected Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
