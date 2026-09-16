import mongoose from "mongoose";

const OrganizationMembershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: [
        "owner",
        "admin",
        "marketing_manager",
        "marketing_member",
        "viewer"
      ],
      required: true
    },

    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active"
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    joinedAt: Date
  },
  {
    timestamps: true
  }
);

OrganizationMembershipSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true }
);

export default mongoose.model(
  "OrganizationMembership",
  OrganizationMembershipSchema
);