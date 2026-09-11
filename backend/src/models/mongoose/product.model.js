import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: String,

    type: {
      type: String,
      enum: ["product", "service", "solution"],
      required: true
    },

    description: String,
    features: [String],
    benefits: [String],

    pricing: {
      model: String,
      startingPrice: Number,
      currency: String,
      description: String
    },

    differentiators: [String],
    targetIndustries: [String],
    targetCompanySizes: [String],
    targetGeographies: [String],

    competitors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competitor"
      }
    ],

    landingPageUrl: String,

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active"
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

ProductSchema.index({
  organizationId: 1,
  companyId: 1,
  name: 1
});

export default mongoose.model("Product", ProductSchema);