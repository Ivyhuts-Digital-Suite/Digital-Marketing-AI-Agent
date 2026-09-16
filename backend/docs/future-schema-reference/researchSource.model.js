import mongoose from "mongoose";

const ResearchSourceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    url: {
      type: String,
      required: true
    },

    title: String,
    domain: String,
    author: String,
    publishedAt: Date,

    retrievedAt: {
      type: Date,
      default: Date.now
    },

    sourceType: {
      type: String,
      enum: [
        "website",
        "article",
        "news",
        "report",
        "social",
        "search_result",
        "documentation",
        "other"
      ]
    },

    credibilityScore: Number,
    contentHash: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

ResearchSourceSchema.index({
  organizationId: 1,
  url: 1
});

export default mongoose.model(
  "ResearchSource",
  ResearchSourceSchema
);