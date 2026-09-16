import mongoose, { Document, Schema, Types } from "mongoose";

const ORGANIZATION_ROLES = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export { ORGANIZATION_ROLES };

/**
 * The join record every organizationId-scoped endpoint should ultimately
 * check before trusting a client-supplied organizationId - see
 * src/middleware/organization.middleware.ts. One document per (user,
 * organization) pair; the unique compound index is what makes "is this
 * user actually in this organization" a real, enforced question instead of
 * an assumption.
 */
export interface IOrganizationMembership extends Document {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  role: OrganizationRole;
}

const organizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    role: { type: String, enum: ORGANIZATION_ROLES, required: true, default: "member" },
  },
  {
    timestamps: true,
  }
);

organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  "OrganizationMembership",
  organizationMembershipSchema
);

export default OrganizationMembership;
