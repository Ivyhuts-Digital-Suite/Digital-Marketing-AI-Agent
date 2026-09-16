import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    legalName: String,
    website: String,
    description: String,

    industry: {
      type: String,
      index: true
    },

    subIndustry: String,
    businessModel: String,

    companySize: {
      minEmployees: Number,
      maxEmployees: Number
    },

    headquarters: {
      city: String,
      state: String,
      country: String,
      timezone: String
    },

    targetMarkets: [
      {
        country: String,
        region: String,
        city: String
      }
    ],

    socialProfiles: {
      instagram: String,
      facebook: String,
      website: String,
      youtube: String
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active"
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: Date
  },
  {
    timestamps: true
  }
);

CompanySchema.index({ organizationId: 1, name: 1 });

export default mongoose.model("Company", CompanySchema);