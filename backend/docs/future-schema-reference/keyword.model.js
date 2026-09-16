import mongoose from "mongoose";

const KeywordSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    keyword: {
      type: String,
      required: true,
      trim: true
    },

    intent: {
      type: String,
      enum: [
        "informational",
        "commercial",
        "transactional",
        "navigational"
      ]
    },

    searchVolume: Number,
    difficulty: Number,
    competition: Number,
    cpc: Number,
    trendScore: Number,

    relatedKeywords: [String],
    source: String,
    lastUpdatedAt: Date
  },
  {
    timestamps: true
  }
);

KeywordSchema.index({
  organizationId: 1,
  keyword: 1
});

export default mongoose.model("Keyword", KeywordSchema);