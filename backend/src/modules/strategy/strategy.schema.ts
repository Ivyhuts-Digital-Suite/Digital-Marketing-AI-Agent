import mongoose, { Document, Schema } from 'mongoose';
import {
  MarketingStrategyPayload,
  BusinessGoalItem,
  StrategyDecision,
  StrategyChangeRecord,
} from './strategy.types';

export interface IStrategyDocument extends MarketingStrategyPayload, Document {}

const StrategyDecisionSchema = new Schema<StrategyDecision>(
  {
    category: { type: String, required: true },
    decision: { type: String, required: true },
    rationale: { type: String, required: true },
    evidence: {
      sourceType: {
        type: String,
        enum: ['company', 'research', 'business_goal'],
        required: true,
      },
      referenceId: { type: String },
      claim: { type: String },
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const StrategySchema = new Schema<IStrategyDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    strategyId: { type: String, required: true, unique: true, index: true },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    icp: {
      companySize: { type: String, required: true },
      industry: [{ type: String, required: true }],
      geography: [{ type: String, required: true }],
      revenueRange: { type: String },
      technologyMaturity: { type: String },
      painPoints: [{ type: String }],
      buyingTriggers: [{ type: String }],
      decisionMakers: [{ type: String }],
    },
    buyerPersonas: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['Decision Maker', 'Influencer', 'End User'],
          required: true,
        },
        role: { type: String, required: true },
        responsibilities: [{ type: String }],
        goals: [{ type: String }],
        painPoints: [{ type: String }],
        objections: [{ type: String }],
        buyingMotivation: [{ type: String }],
        preferredContent: [{ type: String }],
      },
    ],
    positioning: {
      positioningStatement: { type: String, required: true },
      targetAudience: { type: String, required: true },
      problemSolved: { type: String, required: true },
      valueProposition: { type: String, required: true },
      differentiators: [{ type: String }],
      competitivePosition: { type: String, required: true },
    },
    messagingFramework: {
      coreMessage: { type: String, required: true },
      valueProposition: { type: String, required: true },
      painBasedMessages: [{ type: String }],
      benefitMessages: [{ type: String }],
      proofMessages: [{ type: String }],
      personaSpecificMessages: [
        {
          personaType: { type: String, required: true },
          message: { type: String, required: true },
        },
      ],
    },
    funnel: [
      {
        stage: {
          type: String,
          enum: ['AWARENESS', 'CONSIDERATION', 'CONVERSION', 'RETENTION'],
          required: true,
        },
        goal: { type: String, required: true },
        audience: { type: String, required: true },
        message: { type: String, required: true },
        content: [{ type: String }],
        channels: [{ type: String }],
        cta: { type: String, required: true },
        kpis: [{ type: String }],
      },
    ],
    channelStrategy: [
      {
        channel: { type: String, required: true },
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
          required: true,
        },
        rationale: { type: String, required: true },
        targetStage: [{ type: String }],
        contentFormats: [{ type: String }],
      },
    ],
    contentPillars: [
      {
        pillarName: { type: String, required: true },
        description: { type: String, required: true },
        subTopics: [{ type: String }],
        intendedChannels: [{ type: String }],
        targetPersonas: [{ type: String }],
      },
    ],
    campaignStrategy: [
      {
        name: { type: String, required: true },
        objective: { type: String, required: true },
        audience: { type: String, required: true },
        coreMessage: { type: String, required: true },
        offer: { type: String, required: true },
        channels: [{ type: String }],
        contentDeliverables: [{ type: String }],
        timeline: { type: String, required: true },
        kpis: [{ type: String }],
      },
    ],
    kpis: [
      {
        category: {
          type: String,
          enum: ['Awareness', 'Engagement', 'Acquisition', 'Retention'],
          required: true,
        },
        metric: { type: String, required: true },
        targetValue: { type: String, required: true },
        timeframe: { type: String, required: true },
      },
    ],
    budgetRecommendations: {
      totalEstimatedBudget: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      isEstimated: { type: Boolean, default: true },
      allocations: {
        paidAdvertising: { type: Number, default: 0 },
        contentProduction: { type: Number, default: 0 },
        influencerPartnerships: { type: Number, default: 0 },
        toolsAndSoftware: { type: Number, default: 0 },
        experiments: { type: Number, default: 0 },
      },
    },
    decisions: [StrategyDecisionSchema],
  },
  { timestamps: true }
);

export const StrategyModel = mongoose.model<IStrategyDocument>(
  'Strategy',
  StrategySchema
);

// --- Version History Collection ---
export interface IStrategyVersionDocument extends Document {
  strategyId: string;
  version: number;
  organizationId: string;
  snapshot: MarketingStrategyPayload;
  changes: StrategyChangeRecord[];
  createdAt: Date;
}

const StrategyVersionSchema = new Schema<IStrategyVersionDocument>(
  {
    strategyId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changes: [
      {
        category: { type: String, required: true },
        previousValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
        reason: { type: String, required: true },
        evidenceIds: [{ type: String }],
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StrategyVersionSchema.index({ strategyId: 1, version: 1 }, { unique: true });

export const StrategyVersionModel = mongoose.model<IStrategyVersionDocument>(
  'StrategyVersion',
  StrategyVersionSchema
);

// --- Business Goal Collection ---
export interface IBusinessGoalDocument extends Document {
  organizationId: string;
  goals: BusinessGoalItem[];
  status: 'active' | 'completed' | 'archived';
}

const BusinessGoalSchema = new Schema<IBusinessGoalDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    goals: [
      {
        type: { type: String, required: true },
        description: { type: String, required: true },
        targetValue: { type: Number },
        timeframe: { type: String },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const BusinessGoalModel = mongoose.model<IBusinessGoalDocument>(
  'BusinessGoal',
  BusinessGoalSchema
);