import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import OrganizationMembership, { IOrganizationMembership } from "../models/OrganizationMembership";

declare global {
  namespace Express {
    interface Request {
      membership?: IOrganizationMembership;
    }
  }
}

export class OrganizationAccessError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "OrganizationAccessError";
  }
}

/**
 * Looks up (and returns) the membership proving `userId` belongs to
 * `organizationId`. Throws OrganizationAccessError otherwise - the one
 * place every organizationId-scoped operation should route through
 * instead of trusting a client-supplied id at face value. Used directly
 * (not as Express middleware) by services that don't receive organizationId
 * as a simple body/param field, e.g. Content Studio, which derives it from
 * a resolved ContentPlan.
 */
export async function assertOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<IOrganizationMembership> {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new OrganizationAccessError("organizationId is missing or invalid");
  }

  const membership = await OrganizationMembership.findOne({ userId, organizationId });
  if (!membership) {
    throw new OrganizationAccessError("You do not have access to this organization");
  }

  return membership;
}

type OrganizationIdSource = "body" | "params";

/**
 * Express middleware: verifies the authenticated user (populated by
 * `authenticate`) belongs to the organizationId found at
 * `req[source][field]`. Attaches the membership to `req.membership` on
 * success. Apply this immediately after `authenticate` on any route that
 * reads a client-supplied organizationId.
 */
export function requireOrganizationMembership(source: OrganizationIdSource, field = "organizationId") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const organizationId = source === "body" ? req.body?.[field] : req.params?.[field];

    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: `${field} is required` });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    try {
      req.membership = await assertOrganizationMembership(req.user.id, organizationId);
      next();
    } catch (error) {
      if (error instanceof OrganizationAccessError) {
        res.status(403).json({ message: "You do not have access to this organization" });
        return;
      }
      console.error("Organization membership check failed:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
}
