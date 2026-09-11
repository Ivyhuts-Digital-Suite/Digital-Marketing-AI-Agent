import mongoose, { Schema, Document } from "mongoose";

export interface IResearchDocument extends Document {
  companyName: string;
  industry?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  plan: {
    steps: string[];
    targetDomains: string[];
    searchQueries: string[];
  };
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
    isValidated: boolean;
    credibilityScore: number;
  }>;
  claims: Array<{
    sourceUrl: string;
    claim: string;
    category: string;
    confidence: number;
  }>;
  synthesis: {
    summary: string;
    insights: string[];
    competitorAnalysis?: Record<string, unknown>;
    marketTrends?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResearchSchema = new Schema<IResearchDocument>(
  {
    companyName: { type: String, required: true },
    industry: { type: String },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
    plan: {
      steps: [{ type: String }],
      targetDomains: [{ type: String }],
      searchQueries: [{ type: String }],
    },
    sources: [
      {
        url: { type: String, required: true },
        title: { type: String, default: "" },
        snippet: { type: String, default: "" },
        isValidated: { type: Boolean, default: false },
        credibilityScore: { type: Number, default: 0 },
      },
    ],
    claims: [
      {
        sourceUrl: { type: String, required: true },
        claim: { type: String, required: true },
        category: { type: String, default: "general" },
        confidence: { type: Number, default: 0 },
      },
    ],
    synthesis: {
      summary: { type: String, default: "" },
      insights: [{ type: String }],
      competitorAnalysis: { type: Schema.Types.Mixed },
      marketTrends: [{ type: String }],
    },
  },
  { timestamps: true }
);

export const ResearchModel = mongoose.model<IResearchDocument>(
  "Research",
  ResearchSchema
);
