import { Request, Response } from "express";
import Organization from "../models/Organization";
import OrganizationMembership from "../models/OrganizationMembership";
import { generateUniqueOrganizationSlug } from "../utils/slug";

/** GET /api/organizations - every organization the authenticated user belongs to, with their role in each. */
export const listMyOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const memberships = await OrganizationMembership.find({ userId }).lean();
    if (memberships.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const organizationIds = memberships.map((membership) => membership.organizationId);
    const organizations = await Organization.find({ _id: { $in: organizationIds } }).lean();
    const roleByOrganizationId = new Map(memberships.map((m) => [m.organizationId.toString(), m.role]));

    const data = organizations.map((organization) => ({
      _id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      website: organization.website,
      industry: organization.industry,
      size: organization.size,
      role: roleByOrganizationId.get(organization._id.toString()) ?? "member",
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("List Organizations Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** POST /api/organizations - creates a new organization owned by the authenticated user. */
export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, website, industry, size } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ success: false, message: "name is required" });
      return;
    }

    const userId = req.user?.id;
    const slug = await generateUniqueOrganizationSlug(name);

    const organization = await Organization.create({
      name: name.trim(),
      slug,
      description: typeof description === "string" ? description : undefined,
      website: typeof website === "string" ? website : undefined,
      industry: typeof industry === "string" ? industry : undefined,
      size: typeof size === "string" ? size : undefined,
    });

    try {
      await OrganizationMembership.create({ userId, organizationId: organization._id, role: "owner" });
    } catch (membershipError) {
      // No transaction here - see registerUser's comment on why - so compensate manually.
      await Organization.deleteOne({ _id: organization._id });
      throw membershipError;
    }

    res.status(201).json({
      success: true,
      data: {
        _id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        website: organization.website,
        industry: organization.industry,
        size: organization.size,
        role: "owner",
      },
    });
  } catch (error) {
    console.error("Create Organization Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
