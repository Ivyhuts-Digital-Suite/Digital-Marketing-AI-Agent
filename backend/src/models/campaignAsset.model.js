import mongoose from "mongoose";

const CampaignAssetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true
    },

    contentAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentAsset"
    },

    role: {
      type: String,
      enum: [
        "primary_creative",
        "secondary_creative",
        "thumbnail",
        "ad_creative",
        "landing_page_asset"
      ]
    },

    performance: {
      impressions: Number,
      clicks: Number,
      ctr: Number,
      conversions: Number,
      conversionRate: Number,
      spend: Number,
      cpc: Number,
      cpa: Number,
      revenue: Number,
      roas: Number
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "CampaignAsset",
  CampaignAssetSchema
);