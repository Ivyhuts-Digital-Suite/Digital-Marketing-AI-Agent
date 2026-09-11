# Mongoose Schema PRD
## B2B Digital Marketing AI Agent

**Document Type:** Database / Mongoose Schema Specification  
**Database:** MongoDB  
**ODM:** Mongoose  
**Language:** TypeScript  
**Status:** Final  
**Scope:** Persistent application data models only

---

# 1. Purpose

This document defines the canonical MongoDB/Mongoose data model for the B2B Digital Marketing AI Agent.

The schema is designed around the finalized architecture:

```text
Organization
    │
    ├── Company / Brand
    │
    ├── Products
    ├── Personas
    ├── Marketing Goals
    │
    ├── Research
    ├── Strategy
    ├── Content
    ├── Campaigns
    ├── Analytics
    ├── Experiments
    ├── Recommendations
    │
    ├── Agent Tasks / Runs
    ├── Approvals
    └── Integrations
```

The database must support:

- Multi-tenancy
- Company intelligence
- Brand knowledge
- Marketing research
- Marketing strategy
- Instagram-first content
- Text/graphic/video content
- Campaign management
- Marketing analytics
- AI recommendations
- Experiments
- Agent execution history
- Human approvals
- External integrations
- Semantic knowledge retrieval
- Auditability
- Versioning
- Historical performance analysis

---

# 2. Database Design Principles

## 2.1 Multi-tenancy

Every organization-owned document MUST contain:

```ts
organizationId: ObjectId
```

All application-level queries must be scoped by `organizationId`.

Never retrieve organization-owned resources by `_id` alone.

Correct:

```ts
Model.findOne({
  _id: resourceId,
  organizationId
});
```

Incorrect:

```ts
Model.findById(resourceId);
```

---

# 2.2 Ownership hierarchy

The primary hierarchy is:

```text
User
  │
  └── Organization
          │
          ├── Company
          │     ├── Products
          │     ├── Personas
          │     ├── Brand Profile
          │     └── Marketing Goals
          │
          ├── Research
          ├── Strategies
          ├── Content
          ├── Campaigns
          ├── Analytics
          ├── Experiments
          ├── Recommendations
          ├── Agent Tasks
          ├── Agent Runs
          ├── Approvals
          └── Integrations
```

---

# 2.3 ObjectId references

Use Mongoose `ObjectId` references for relationships.

Example:

```ts
companyId: {
  type: Schema.Types.ObjectId,
  ref: 'Company',
  required: true,
  index: true
}
```

Do not duplicate large related objects inside documents.

Store references and retrieve related documents when required.

---

# 2.4 Embedded documents

Small, tightly coupled structures should be embedded.

Examples:

- Address
- Social links
- Brand colors
- Persona pain points
- Content metrics
- Creative specifications
- Agent tool-call metadata
- Experiment variants

Large or independently queried entities should be separate collections.

---

# 2.5 Timestamps

All primary models should use:

```ts
{
  timestamps: true
}
```

This automatically provides:

```ts
createdAt
updatedAt
```

---

# 2.6 Soft deletion

Models that represent important business history should NOT be physically deleted by default.

Use:

```ts
isDeleted: boolean
deletedAt?: Date
```

Recommended for:

- Companies
- Products
- Personas
- Content
- Campaigns
- Strategies
- Integrations
- Knowledge documents

Agent execution and analytics history should generally never be deleted through normal application operations.

---

# 3. Common TypeScript Types

These types should be defined in a shared package.

```ts
type ObjectId = Types.ObjectId;

type Status =
  | 'active'
  | 'inactive'
  | 'archived';

type UserRole =
  | 'owner'
  | 'admin'
  | 'marketing_manager'
  | 'marketing_member'
  | 'viewer';

type AgentType =
  | 'orchestrator'
  | 'research'
  | 'strategy'
  | 'content'
  | 'campaign'
  | 'analytics'
  | 'optimization';

type ContentType =
  | 'post'
  | 'carousel'
  | 'reel'
  | 'story'
  | 'blog'
  | 'email'
  | 'ad'
  | 'landing_page';

type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'thumbnail'
  | 'logo';

type Channel =
  | 'instagram'
  | 'meta_ads'
  | 'google_ads'
  | 'email'
  | 'website'
  | 'blog'
  | 'crm';

type CampaignType =
  | 'organic'
  | 'paid'
  | 'email'
  | 'content'
  | 'lead_generation'
  | 'brand_awareness'
  | 'conversion';

type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'expired';

type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

type ContentStatus =
  | 'draft'
  | 'review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived';
```

---

# 4. MODEL CATALOG

The application should initially contain the following Mongoose models.

## Identity & tenancy

1. `User`
2. `Organization`
3. `OrganizationMembership`

## Business intelligence

4. `Company`
5. `Product`
6. `Persona`
7. `BrandProfile`
8. `MarketingGoal`

## Research & strategy

9. `Competitor`
10. `ResearchReport`
11. `ResearchSource`
12. `Keyword`
13. `MarketingStrategy`

## Content & media

14. `Content`
15. `ContentAsset`
16. `ContentCalendar`

## Campaigns

17. `Campaign`
18. `CampaignAsset`

## Analytics

19. `AnalyticsSnapshot`
20. `MetricRecord`

## AI / agent system

21. `AgentTask`
22. `AgentRun`
23. `AgentMemory`
24. `AgentLearning`

## Recommendations & experimentation

25. `Recommendation`
26. `Experiment`
27. `ExperimentVariant`
28. `ExperimentResult`

## Approvals

29. `Approval`

## Integrations

30. `Integration`
31. `IntegrationAccount`
32. `IntegrationSync`

## Knowledge / RAG

33. `KnowledgeDocument`
34. `KnowledgeChunk`

## Auditing

35. `AuditLog`

---

# 5. User

## Purpose

Represents an authenticated application user.

## Collection

```text
users
```

## Schema

```ts
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    avatarUrl: {
      type: String
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
      index: true
    },

    lastLoginAt: Date
  },
  {
    timestamps: true
  }
);
```

## Notes

Authentication secrets and passwords should follow the project's authentication architecture and must not be duplicated into business-data documents.

---

# 6. Organization

## Purpose

Top-level tenant.

A customer/company using the marketing platform belongs to an organization.

## Collection

```text
organizations
```

## Schema

```ts
const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
      index: true
    },

    settings: {
      timezone: String,
      currency: String,
      locale: String
    },

    subscription: {
      plan: String,
      status: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date
    }
  },
  {
    timestamps: true
  }
);
```

---

# 7. OrganizationMembership

## Purpose

Maps users to organizations and defines permissions.

## Collection

```text
organization_memberships
```

## Schema

```ts
const OrganizationMembershipSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: [
        'owner',
        'admin',
        'marketing_manager',
        'marketing_member',
        'viewer'
      ],
      required: true
    },

    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active'
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
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
```

---

# 8. Company

## Purpose

Represents the business being marketed.

This is the root of the **Company Brain**.

## Collection

```text
companies
```

## Schema

```ts
const CompanySchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    legalName: String,

    website: {
      type: String,
      trim: true
    },

    description: String,

    industry: {
      type: String,
      index: true
    },

    subIndustry: String,

    businessModel: {
      type: String
    },

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
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
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

CompanySchema.index({
  organizationId: 1,
  name: 1
});
```

---

# 9. Product

## Purpose

Represents a product or service being marketed.

## Collection

```text
products
```

## Schema

```ts
const ProductSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
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
      enum: ['product', 'service', 'solution'],
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
        type: Schema.Types.ObjectId,
        ref: 'Competitor'
      }
    ],

    landingPageUrl: String,

    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
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
```

---

# 10. Persona

## Purpose

Represents an ideal buyer/user persona.

## Collection

```text
personas
```

## Schema

```ts
const PersonaSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    jobTitles: [String],

    seniority: [String],

    industries: [String],

    companySizes: [String],

    geographies: [String],

    goals: [String],

    painPoints: [String],

    challenges: [String],

    buyingMotivations: [String],

    objections: [String],

    decisionCriteria: [String],

    buyingTriggers: [String],

    preferredChannels: [String],

    contentPreferences: [String],

    messagingGuidelines: [String],

    priority: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 11. BrandProfile

## Purpose

Stores the rules the AI must follow when generating marketing material.

## Collection

```text
brand_profiles
```

## Schema

```ts
const BrandProfileSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    voice: {
      primary: String,
      secondary: [String],
      description: String
    },

    tone: {
      type: [String],
      default: []
    },

    personality: [String],

    positioning: String,

    tagline: String,

    messaging: {
      coreMessage: String,
      valueProposition: String,
      keyMessages: [String],
      elevatorPitch: String
    },

    visualIdentity: {
      primaryColors: [String],
      secondaryColors: [String],
      fonts: [String],
      style: [String],
      imageStyle: [String]
    },

    logos: [
      {
        type: {
          type: String,
          enum: ['primary', 'secondary', 'monochrome', 'icon']
        },
        assetId: {
          type: Schema.Types.ObjectId,
          ref: 'ContentAsset'
        }
      }
    ],

    contentRules: {
      preferredWords: [String],
      forbiddenWords: [String],
      preferredTopics: [String],
      forbiddenTopics: [String],
      preferredCtaStyles: [String]
    },

    claimPolicy: {
      allowedClaims: [String],
      restrictedClaims: [String],
      forbiddenClaims: [String]
    },

    instagramGuidelines: {
      preferredFormats: [String],
      hashtagStyle: String,
      captionStyle: String,
      reelStyle: String,
      carouselStyle: String
    },

    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);
```

---

# 12. MarketingGoal

## Purpose

Stores business and marketing objectives.

## Collection

```text
marketing_goals
```

## Schema

```ts
const MarketingGoalSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        'brand_awareness',
        'engagement',
        'traffic',
        'lead_generation',
        'sales',
        'revenue',
        'retention',
        'customer_acquisition'
      ],
      required: true
    },

    description: String,

    targetMetric: String,

    targetValue: Number,

    currentValue: Number,

    unit: String,

    startDate: Date,

    targetDate: Date,

    priority: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'achieved', 'failed', 'cancelled'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 13. Competitor

## Purpose

Stores competitor intelligence.

## Collection

```text
competitors
```

## Schema

```ts
const CompetitorSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    name: {
      type: String,
      required: true
    },

    website: String,

    description: String,

    industry: String,

    products: [String],

    pricing: String,

    positioning: String,

    valueProposition: String,

    strengths: [String],

    weaknesses: [String],

    targetAudience: [String],

    channels: [String],

    socialProfiles: {
      instagram: String,
      facebook: String,
      youtube: String
    },

    lastResearchAt: Date,

    researchStatus: {
      type: String,
      enum: ['pending', 'active', 'stale'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 14. ResearchSource

## Purpose

Represents an external source used by the Research Agent.

## Collection

```text
research_sources
```

## Schema

```ts
const ResearchSourceSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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
        'website',
        'article',
        'news',
        'report',
        'social',
        'search_result',
        'documentation',
        'other'
      ]
    },

    credibilityScore: Number,

    contentHash: String,

    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

ResearchSourceSchema.index({
  organizationId: 1,
  url: 1
});
```

---

# 15. ResearchReport

## Purpose

Stores synthesized research produced by the Research Agent.

## Collection

```text
research_reports
```

## Schema

```ts
const ResearchReportSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    type: {
      type: String,
      enum: [
        'market',
        'competitor',
        'customer',
        'keyword',
        'trend',
        'content_gap',
        'industry'
      ],
      required: true
    },

    title: String,

    query: String,

    summary: String,

    findings: [
      {
        title: String,
        description: String,
        importance: Number,
        confidence: Number
      }
    ],

    opportunities: [String],

    threats: [String],

    recommendations: [String],

    sourceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ResearchSource'
      }
    ],

    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    },

    generatedAt: Date,

    expiresAt: Date,

    status: {
      type: String,
      enum: ['draft', 'completed', 'stale', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 16. Keyword

## Purpose

Stores keyword intelligence.

## Collection

```text
keywords
```

## Schema

```ts
const KeywordSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
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
        'informational',
        'commercial',
        'transactional',
        'navigational'
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
```

---

# 17. MarketingStrategy

## Purpose

Stores AI-generated marketing strategies.

## Collection

```text
marketing_strategies
```

## Schema

```ts
const MarketingStrategySchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    version: {
      type: Number,
      required: true
    },

    name: String,

    objective: String,

    executiveSummary: String,

    targetAudience: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Persona'
      }
    ],

    positioning: String,

    messaging: {
      coreMessage: String,
      valueProposition: String,
      keyMessages: [String]
    },

    funnel: {
      awareness: [String],
      consideration: [String],
      conversion: [String],
      retention: [String]
    },

    channels: [
      {
        channel: String,
        priority: Number,
        purpose: String,
        expectedOutcome: String
      }
    ],

    contentPillars: [
      {
        name: String,
        description: String,
        percentage: Number
      }
    ],

    budgetRecommendation: {
      total: Number,
      currency: String,
      allocation: [
        {
          channel: String,
          percentage: Number,
          amount: Number
        }
      ]
    },

    kpis: [
      {
        name: String,
        target: Number,
        unit: String
      }
    ],

    risks: [String],

    assumptions: [String],

    sourceResearchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ResearchReport'
      }
    ],

    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'superseded', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);

MarketingStrategySchema.index(
  { organizationId: 1, companyId: 1, version: -1 },
  { unique: true }
);
```

---

# 18. Content

## Purpose

Central model for all marketing content.

Instagram is the primary content channel.

## Collection

```text
content
```

## Schema

```ts
const ContentSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },

    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign'
    },

    strategyId: {
      type: Schema.Types.ObjectId,
      ref: 'MarketingStrategy'
    },

    personaId: {
      type: Schema.Types.ObjectId,
      ref: 'Persona'
    },

    parentContentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content'
    },

    title: String,

    contentType: {
      type: String,
      enum: [
        'post',
        'carousel',
        'reel',
        'story',
        'blog',
        'email',
        'ad',
        'landing_page'
      ],
      required: true,
      index: true
    },

    channel: {
      type: String,
      enum: [
        'instagram',
        'email',
        'website',
        'blog',
        'meta_ads',
        'google_ads'
      ],
      required: true,
      index: true
    },

    funnelStage: {
      type: String,
      enum: [
        'awareness',
        'consideration',
        'conversion',
        'retention'
      ]
    },

    contentPillar: String,

    objective: String,

    hook: String,

    body: String,

    caption: String,

    callToAction: String,

    hashtags: [String],

    script: String,

    storyboard: [
      {
        sceneNumber: Number,
        description: String,
        narration: String,
        visualDirection: String,
        durationSeconds: Number
      }
    ],

    creativeBrief: {
      concept: String,
      visualDirection: String,
      targetEmotion: String,
      composition: String,
      aspectRatio: String,
      style: String
    },

    assetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ContentAsset'
      }
    ],

    generatedBy: {
      type: String,
      enum: ['human', 'ai', 'hybrid'],
      default: 'ai'
    },

    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    },

    version: {
      type: Number,
      default: 1
    },

    status: {
      type: String,
      enum: [
        'draft',
        'review',
        'changes_requested',
        'approved',
        'scheduled',
        'published',
        'failed',
        'archived'
      ],
      default: 'draft',
      index: true
    },

    scheduledAt: Date,

    publishedAt: Date,

    externalPublication: {
      platform: String,
      externalId: String,
      externalUrl: String
    },

    performanceSummary: {
      impressions: Number,
      reach: Number,
      engagement: Number,
      clicks: Number,
      conversions: Number
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

ContentSchema.index({
  organizationId: 1,
  channel: 1,
  status: 1
});

ContentSchema.index({
  organizationId: 1,
  scheduledAt: 1
});
```

---

# 19. ContentAsset

## Purpose

Stores metadata for generated or uploaded media.

Actual binary files belong in object storage.

## Collection

```text
content_assets
```

## Schema

```ts
const ContentAssetSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },

    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content'
    },

    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign'
    },

    assetType: {
      type: String,
      enum: [
        'image',
        'video',
        'audio',
        'document',
        'thumbnail',
        'logo'
      ],
      required: true
    },

    source: {
      type: String,
      enum: ['upload', 'ai_generated', 'external'],
      required: true
    },

    storage: {
      provider: String,
      bucket: String,
      key: String,
      url: String
    },

    mimeType: String,

    fileSize: Number,

    width: Number,

    height: Number,

    durationSeconds: Number,

    aspectRatio: String,

    generation: {
      model: String,
      prompt: String,
      negativePrompt: String,
      seed: String,
      parameters: Schema.Types.Mixed
    },

    parentAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentAsset'
    },

    version: {
      type: Number,
      default: 1
    },

    metadata: Schema.Types.Mixed,

    status: {
      type: String,
      enum: ['processing', 'ready', 'failed', 'archived'],
      default: 'processing'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 20. ContentCalendar

## Purpose

Stores planned publishing schedules.

## Collection

```text
content_calendars
```

## Schema

```ts
const ContentCalendarSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    name: String,

    startDate: Date,

    endDate: Date,

    timezone: String,

    entries: [
      {
        contentId: {
          type: Schema.Types.ObjectId,
          ref: 'Content'
        },

        scheduledAt: Date,

        channel: String,

        status: {
          type: String,
          enum: [
            'planned',
            'draft',
            'approved',
            'scheduled',
            'published',
            'failed'
          ]
        },

        notes: String
      }
    ],

    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 21. Campaign

## Purpose

Represents a coordinated marketing campaign.

## Collection

```text
campaigns
```

## Schema

```ts
const CampaignSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },

    strategyId: {
      type: Schema.Types.ObjectId,
      ref: 'MarketingStrategy'
    },

    name: {
      type: String,
      required: true
    },

    description: String,

    type: {
      type: String,
      enum: [
        'organic',
        'paid',
        'email',
        'content',
        'lead_generation',
        'brand_awareness',
        'conversion'
      ],
      required: true
    },

    channels: [String],

    objective: String,

    targetPersonas: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Persona'
      }
    ],

    budget: {
      amount: Number,
      currency: String,
      dailyLimit: Number
    },

    startDate: Date,

    endDate: Date,

    kpis: [
      {
        metric: String,
        target: Number,
        unit: String
      }
    ],

    contentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Content'
      }
    ],

    assetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CampaignAsset'
      }
    ],

    externalCampaigns: [
      {
        platform: String,
        externalId: String,
        status: String
      }
    ],

    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'scheduled',
        'active',
        'paused',
        'completed',
        'cancelled',
        'failed'
      ],
      default: 'draft',
      index: true
    },

    createdBy: {
      type: String,
      enum: ['human', 'ai', 'hybrid']
    },

    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 22. CampaignAsset

## Purpose

Associates creative assets with campaigns.

## Collection

```text
campaign_assets
```

## Schema

```ts
const CampaignAssetSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true
    },

    contentAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentAsset'
    },

    role: {
      type: String,
      enum: [
        'primary_creative',
        'secondary_creative',
        'thumbnail',
        'ad_creative',
        'landing_page_asset'
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
```

---

# 23. AnalyticsSnapshot

## Purpose

Stores aggregated analytics at a specific point in time.

## Collection

```text
analytics_snapshots
```

## Schema

```ts
const AnalyticsSnapshotSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    channel: {
      type: String,
      enum: [
        'instagram',
        'meta_ads',
        'google_ads',
        'email',
        'website',
        'crm'
      ],
      required: true
    },

    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign'
    },

    period: {
      start: Date,
      end: Date
    },

    metrics: {
      impressions: Number,
      reach: Number,
      engagement: Number,
      engagementRate: Number,
      clicks: Number,
      ctr: Number,
      leads: Number,
      mqls: Number,
      sqls: Number,
      opportunities: Number,
      conversions: Number,
      conversionRate: Number,
      spend: Number,
      revenue: Number,
      cpc: Number,
      cpl: Number,
      cpa: Number,
      roas: Number
    },

    source: String,

    fetchedAt: Date
  },
  {
    timestamps: true
  }
);

AnalyticsSnapshotSchema.index({
  organizationId: 1,
  channel: 1,
  'period.start': -1
});
```

---

# 24. MetricRecord

## Purpose

Stores granular normalized marketing metrics.

Useful for time-series analysis and optimization.

## Collection

```text
metric_records
```

## Schema

```ts
const MetricRecordSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    channel: String,

    entityType: {
      type: String,
      enum: [
        'account',
        'content',
        'campaign',
        'ad',
        'keyword',
        'email',
        'landing_page'
      ]
    },

    entityId: Schema.Types.ObjectId,

    metric: {
      type: String,
      required: true,
      index: true
    },

    value: {
      type: Number,
      required: true
    },

    unit: String,

    recordedAt: {
      type: Date,
      required: true,
      index: true
    },

    source: String,

    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

MetricRecordSchema.index({
  organizationId: 1,
  entityType: 1,
  entityId: 1,
  metric: 1,
  recordedAt: -1
});
```

---

# 25. AgentTask

## Purpose

Represents a logical task requested by the user or generated by another agent.

## Collection

```text
agent_tasks
```

## Schema

```ts
const AgentTaskSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentTask'
    },

    type: String,

    request: {
      type: String,
      required: true
    },

    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal'
    },

    requestedAgent: {
      type: String,
      enum: [
        'orchestrator',
        'research',
        'strategy',
        'content',
        'campaign',
        'analytics',
        'optimization'
      ]
    },

    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'waiting_approval',
        'completed',
        'failed',
        'cancelled'
      ],
      default: 'queued',
      index: true
    },

    context: Schema.Types.Mixed,

    result: Schema.Types.Mixed,

    error: {
      code: String,
      message: String,
      details: Schema.Types.Mixed
    },

    scheduledFor: Date,

    startedAt: Date,

    completedAt: Date
  },
  {
    timestamps: true
  }
);
```

---

# 26. AgentRun

## Purpose

The central observability and audit model for every AI execution.

## Collection

```text
agent_runs
```

## Schema

```ts
const AgentRunSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentTask'
    },

    parentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    },

    agentType: {
      type: String,
      enum: [
        'orchestrator',
        'research',
        'strategy',
        'content',
        'campaign',
        'analytics',
        'optimization'
      ],
      required: true,
      index: true
    },

    model: {
      provider: String,
      name: String,
      version: String
    },

    request: String,

    context: Schema.Types.Mixed,

    plan: [
      {
        stepNumber: Number,
        description: String,
        agentType: String,
        status: String
      }
    ],

    steps: [
      {
        stepNumber: Number,
        type: String,
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        status: String,
        startedAt: Date,
        completedAt: Date
      }
    ],

    toolCalls: [
      {
        toolName: String,
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        status: String,
        startedAt: Date,
        completedAt: Date,
        error: String
      }
    ],

    output: Schema.Types.Mixed,

    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'waiting_approval',
        'completed',
        'failed',
        'cancelled'
      ],
      default: 'queued',
      index: true
    },

    error: {
      code: String,
      message: String,
      stack: String
    },

    usage: {
      inputTokens: Number,
      outputTokens: Number,
      totalTokens: Number
    },

    cost: {
      amount: Number,
      currency: String
    },

    durationMs: Number,

    startedAt: Date,

    completedAt: Date
  },
  {
    timestamps: true
  }
);

AgentRunSchema.index({
  organizationId: 1,
  agentType: 1,
  createdAt: -1
});
```

---

# 27. AgentMemory

## Purpose

Stores reusable agent-specific memory.

## Collection

```text
agent_memories
```

## Schema

```ts
const AgentMemorySchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },

    agentType: String,

    memoryType: {
      type: String,
      enum: [
        'fact',
        'preference',
        'decision',
        'pattern',
        'constraint',
        'learning'
      ]
    },

    key: String,

    content: {
      type: String,
      required: true
    },

    confidence: Number,

    sourceType: String,

    sourceId: Schema.Types.ObjectId,

    expiresAt: Date,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

AgentMemorySchema.index({
  organizationId: 1,
  agentType: 1,
  isActive: 1
});
```

---

# 28. AgentLearning

## Purpose

Stores validated marketing learnings discovered from analytics and experiments.

## Collection

```text
agent_learnings
```

## Schema

```ts
const AgentLearningSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },

    category: {
      type: String,
      enum: [
        'audience',
        'content',
        'channel',
        'creative',
        'messaging',
        'campaign',
        'conversion',
        'timing'
      ]
    },

    statement: {
      type: String,
      required: true
    },

    evidence: [
      {
        type: String,
        sourceId: Schema.Types.ObjectId,
        value: Schema.Types.Mixed
      }
    ],

    confidence: Number,

    impact: {
      metric: String,
      value: Number,
      percentageChange: Number
    },

    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment'
    },

    applicableTo: {
      personas: [Schema.Types.ObjectId],
      channels: [String],
      contentTypes: [String],
      campaigns: [Schema.Types.ObjectId]
    },

    status: {
      type: String,
      enum: ['candidate', 'validated', 'deprecated'],
      default: 'candidate'
    }
  },
  {
    timestamps: true
  }
);
```

---

# 29. Recommendation

## Purpose

Stores recommendations generated by Analytics/Optimization Agents.

## Collection

```text
recommendations
```

## Schema

```ts
const RecommendationSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },

    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentRun'
    },

    type: {
      type: String,
      enum: [
        'content',
        'campaign',
        'budget',
        'audience',
        'creative',
        'seo',
        'conversion',
        'channel',
        'technical'
      ]
    },

    title: {
      type: String,
      required: true
    },

    description: String,

    reasoning: String,

    evidence: [
      {
        metric: String,
        currentValue: Number,
        benchmark: Number,
        sourceId: Schema.Types.ObjectId
      }
    ],

    proposedAction: {
      tool: String,
      parameters: Schema.Types.Mixed
    },

    expectedImpact: {
      metric: String,
      estimatedChange: Number,
      confidence: Number
    },

    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },

    requiresApproval: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'executed',
        'expired',
        'failed'
      ],
      default: 'pending',
      index: true
    },

    executedAt: Date
  },
  {
    timestamps: true
  }
);
```

---

# 30. Experiment

## Purpose

Represents a controlled marketing experiment.

## Collection

```text
experiments
```

## Schema

```ts
const ExperimentSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },

    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign'
    },

    name: {
      type: String,
      required: true
    },

    hypothesis: {
      type: String,
      required: true
    },

    objective: String,

    primaryMetric: String,

    secondaryMetrics: [String],

    baseline: {
      metric: String,
      value: Number
    },

    minimumDetectableEffect: Number,

    confidenceLevel: Number,

    startDate: Date,

    endDate: Date,

    winnerVariantId: {
      type: Schema.Types.ObjectId,
      ref: 'ExperimentVariant'
    },

    learningId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentLearning'
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'running',
        'completed',
        'cancelled'
      ],
      default: 'draft',
      index: true
    }
  },
  {
    timestamps: true
  }
);
```

---

# 31. ExperimentVariant

## Purpose

Represents a variant inside an experiment.

## Collection

```text
experiment_variants
```

## Schema

```ts
const ExperimentVariantSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment',
      required: true,
      index: true
    },

    name: String,

    type: {
      type: String,
      enum: ['control', 'variant'],
      required: true
    },

    description: String,

    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content'
    },

    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentAsset'
    },

    allocationPercentage: Number,

    status: String
  },
  {
    timestamps: true
  }
);
```

---

# 32. ExperimentResult

## Purpose

Stores the measured outcome of an experiment.

## Collection

```text
experiment_results
```

## Schema

```ts
const ExperimentResultSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment',
      required: true,
      index: true
    },

    variantId: {
      type: Schema.Types.ObjectId,
      ref: 'ExperimentVariant',
      required: true
    },

    sampleSize: Number,

    metrics: [
      {
        metric: String,
        value: Number,
        baselineValue: Number,
        change: Number,
        changePercentage: Number
      }
    ],

    statisticalResult: {
      confidence: Number,
      pValue: Number,
      significant: Boolean
    },

    businessImpact: {
      estimatedRevenue: Number,
      estimatedCost: Number,
      roi: Number
    },

    evaluatedAt: Date
  },
  {
    timestamps: true
  }
);
```

---

# 33. Approval

## Purpose

Controls human approval of AI-generated or high-risk actions.

## Collection

```text
approvals
```

## Schema

```ts
const ApprovalSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    entityType: {
      type: String,
      enum: [
        'content',
        'campaign',
        'recommendation',
        'experiment',
        'integration_action',
        'budget_change'
      ],
      required: true
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    action: {
      type: String,
      required: true
    },

    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },

    payload: Schema.Types.Mixed,

    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'changes_requested',
        'expired'
      ],
      default: 'pending',
      index: true
    },

    reviewerComment: String,

    expiresAt: Date,

    reviewedAt: Date
  },
  {
    timestamps: true
  }
);

ApprovalSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1
});
```

---

# 34. Integration

## Purpose

Defines an available external service integration.

## Collection

```text
integrations
```

## Schema

```ts
const IntegrationSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    provider: {
      type: String,
      enum: [
        'instagram',
        'meta',
        'google_ads',
        'google_analytics',
        'google_search_console',
        'email',
        'hubspot',
        'salesforce',
        'other'
      ],
      required: true
    },

    name: String,

    status: {
      type: String,
      enum: [
        'connected',
        'disconnected',
        'expired',
        'error',
        'pending'
      ],
      default: 'pending'
    },

    permissions: [String],

    connectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    connectedAt: Date,

    lastSyncAt: Date,

    error: String
  },
  {
    timestamps: true
  }
);
```

---

# 35. IntegrationAccount

## Purpose

Stores provider-specific account information.

OAuth secrets/tokens must be encrypted or delegated to a secure secret-management layer.

## Collection

```text
integration_accounts
```

## Schema

```ts
const IntegrationAccountSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      required: true,
      index: true
    },

    provider: String,

    externalAccountId: String,

    accountName: String,

    externalBusinessId: String,

    metadata: Schema.Types.Mixed,

    tokenReference: String,

    tokenExpiresAt: Date,

    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'error'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

IntegrationAccountSchema.index({
  organizationId: 1,
  provider: 1,
  externalAccountId: 1
});
```

---

# 36. IntegrationSync

## Purpose

Tracks synchronization jobs with external platforms.

## Collection

```text
integration_syncs
```

## Schema

```ts
const IntegrationSyncSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      required: true
    },

    provider: String,

    syncType: {
      type: String,
      enum: [
        'content',
        'campaigns',
        'analytics',
        'leads',
        'accounts'
      ]
    },

    startedAt: Date,

    completedAt: Date,

    recordsProcessed: Number,

    recordsCreated: Number,

    recordsUpdated: Number,

    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued'
    },

    error: String
  },
  {
    timestamps: true
  }
);
```

---

# 37. KnowledgeDocument

## Purpose

Represents a document or knowledge source ingested into the Company Brain.

Examples:

- Brand guidelines
- Product documentation
- Case studies
- Sales documents
- Customer interviews
- Marketing reports
- Internal documents

## Collection

```text
knowledge_documents
```

## Schema

```ts
const KnowledgeDocumentSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        'pdf',
        'doc',
        'docx',
        'text',
        'url',
        'webpage',
        'brand_guideline',
        'case_study',
        'product_documentation',
        'other'
      ]
    },

    source: {
      type: String,
      enum: ['upload', 'url', 'generated', 'integration']
    },

    sourceUrl: String,

    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentAsset'
    },

    storageKey: String,

    mimeType: String,

    fileSize: Number,

    extractedText: String,

    metadata: Schema.Types.Mixed,

    contentHash: String,

    embeddingModel: String,

    chunkCount: Number,

    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'indexed',
        'failed',
        'archived'
      ],
      default: 'pending',
      index: true
    },

    indexedAt: Date
  },
  {
    timestamps: true
  }
);
```

---

# 38. KnowledgeChunk

## Purpose

Stores semantic chunks used by MongoDB Atlas Vector Search.

## Collection

```text
knowledge_chunks
```

## Schema

```ts
const KnowledgeChunkSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    tokenCount: Number,

    metadata: {
      page: Number,
      section: String,
      heading: String
    }
  },
  {
    timestamps: true
  }
);

KnowledgeChunkSchema.index({
  organizationId: 1,
  documentId: 1,
  chunkIndex: 1
});
```

## Vector index

MongoDB Atlas should create a vector search index on:

```text
embedding
```

The index dimensions must match the selected embedding model.

Do not hard-code embedding dimensions into business logic.

---

# 39. AuditLog

## Purpose

Tracks important human and AI actions.

This is essential for production use.

## Collection

```text
audit_logs
```

## Schema

```ts
const AuditLogSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    actorType: {
      type: String,
      enum: ['user', 'agent', 'system'],
      required: true
    },

    actorId: {
      type: Schema.Types.ObjectId
    },

    action: {
      type: String,
      required: true,
      index: true
    },

    entityType: String,

    entityId: Schema.Types.ObjectId,

    previousState: Schema.Types.Mixed,

    newState: Schema.Types.Mixed,

    metadata: Schema.Types.Mixed,

    ipAddress: String,

    userAgent: String
  },
  {
    timestamps: true
  }
);

AuditLogSchema.index({
  organizationId: 1,
  createdAt: -1
});
```

---

# 40. Model Relationship Map

The major relationships are:

```text
User
 │
 └──────────────┐
                ▼
         Organization
                │
        ┌───────┴─────────┐
        ▼                 ▼
      Company       OrganizationMembership
        │
        ├── Product
        ├── Persona
        ├── BrandProfile
        └── MarketingGoal
                │
                ▼
           Research
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
   Competitor Keyword  ResearchReport
                         │
                         ▼
                    Strategy
                         │
                         ▼
                      Content
                    ┌────┼─────┐
                    ▼    ▼     ▼
                  Text Graphic Video
                    │    │     │
                    └────┼─────┘
                         ▼
                    Campaign
                         │
                         ▼
                     Analytics
                         │
                         ▼
                  Optimization
                         │
                  ┌──────┴───────┐
                  ▼              ▼
            Recommendation    Experiment
                                   │
                                   ▼
                                Learning
```

---

# 41. Agent Relationship Map

```text
User Request
     │
     ▼
 AgentTask
     │
     ▼
 AgentRun
     │
     ├──────────────► Tool Calls
     │
     ├──────────────► Agent Memory
     │
     ├──────────────► Knowledge Retrieval
     │
     ├──────────────► Content
     │
     ├──────────────► Campaign
     │
     ├──────────────► Recommendation
     │
     └──────────────► Approval
```

---

# 42. Content Relationship Map

```text
MarketingStrategy
       │
       ▼
Content
       │
       ├── ContentAsset
       │      ├── Image
       │      ├── Video
       │      ├── Audio
       │      └── Thumbnail
       │
       ├── ContentCalendar
       │
       └── Campaign
```

---

# 43. AI Media Generation Data Flow

Media generation should NOT store binary media inside MongoDB.

```text
Content Agent
      │
      ▼
Creative Brief
      │
      ├───────────────┐
      ▼               ▼
Image Generation   Video Generation
      │               │
      └───────┬───────┘
              ▼
       Object Storage
              │
              ▼
        ContentAsset
              │
              ▼
           Content
```

MongoDB stores metadata.

Object storage stores:

```text
.jpg
.png
.webp
.mp4
.mov
.mp3
```

---

# 44. Agent Autonomy Data Model

Autonomy should be controlled through organization settings.

A future `Organization.settings` structure should support:

```ts
autonomy: {
  level: {
    type: String,
    enum: [
      'assistant',
      'copilot',
      'controlled_agent',
      'autonomous'
    ]
  },

  permissions: {
    canPublishInstagram: Boolean,
    canCreateCampaigns: Boolean,
    canModifyCampaigns: Boolean,
    canChangeBudget: Boolean,
    canSendEmails: Boolean
  },

  financialLimits: {
    maxDailySpend: Number,
    maxCampaignSpend: Number
  },

  approvalRules: [
    {
      action: String,
      required: Boolean,
      riskLevel: String
    }
  ]
}
```

This should be added to the `Organization` schema.

---

# 45. Recommended Additional Organization Settings

Extend `Organization.settings` with:

```ts
settings: {
  timezone: String,

  currency: String,

  locale: String,

  defaultContentLanguage: String,

  defaultChannels: [String],

  autonomy: {
    level: String,

    permissions: {
      canPublishInstagram: Boolean,
      canCreateCampaigns: Boolean,
      canModifyCampaigns: Boolean,
      canChangeBudget: Boolean,
      canSendEmails: Boolean
    },

    financialLimits: {
      maxDailySpend: Number,
      maxCampaignSpend: Number
    }
  },

  notificationPreferences: {
    approvalRequests: Boolean,
    campaignAlerts: Boolean,
    performanceAlerts: Boolean,
    agentFailures: Boolean
  }
}
```

---

# 46. Indexing Strategy

MongoDB indexing must focus on:

## Tenant queries

Almost every organization-owned collection should have:

```text
organizationId
```

indexed.

---

## Common compound indexes

Recommended:

```text
{
  organizationId: 1,
  companyId: 1
}
```

For content:

```text
{
  organizationId: 1,
  channel: 1,
  status: 1
}
```

For campaigns:

```text
{
  organizationId: 1,
  status: 1,
  startDate: -1
}
```

For analytics:

```text
{
  organizationId: 1,
  channel: 1,
  recordedAt: -1
}
```

For agent runs:

```text
{
  organizationId: 1,
  agentType: 1,
  createdAt: -1
}
```

For approvals:

```text
{
  organizationId: 1,
  status: 1,
  createdAt: -1
}
```

For integrations:

```text
{
  organizationId: 1,
  provider: 1
}
```

---

# 47. Unique Constraints

The following should generally be unique:

```text
User.email

Organization.slug

OrganizationMembership
    organizationId + userId

BrandProfile
    organizationId

MarketingStrategy
    organizationId + companyId + version
```

External platform IDs should be unique within their organization/provider scope:

```text
organizationId + provider + externalAccountId
```

---

# 48. Versioning Strategy

AI-generated business artifacts should be versioned.

Important models:

```text
BrandProfile
MarketingStrategy
Content
ContentAsset
```

Example:

```text
Strategy v1
Strategy v2
Strategy v3
```

Content:

```text
Content v1
Content v2
Content v3
```

The system should retain previous versions when changes are strategically significant.

---

# 49. AI Output Storage Rules

AI output should generally be stored in structured form rather than as an unstructured blob.

Bad:

```ts
output: String
```

Better:

```ts
{
  title,
  objective,
  audience,
  messaging,
  recommendations,
  evidence
}
```

However, `Schema.Types.Mixed` is acceptable for:

- Model-specific metadata
- Tool responses
- Raw provider payloads
- Experimental agent output
- Provider-specific analytics fields

Structured application data should always have explicit schema fields.

---

# 50. External API Data

Do not blindly mirror external APIs into MongoDB.

Normalize important fields.

For example:

```text
Instagram API
       │
       ▼
Integration Service
       │
       ▼
Normalized Content
       │
       ▼
Content
```

Raw provider-specific information can be preserved under:

```ts
metadata: Schema.Types.Mixed
```

when necessary.

---

# 51. Analytics Retention

Analytics should be designed for high write volume.

Avoid continuously embedding analytics arrays inside:

```text
Campaign
Content
Company
```

Instead use:

```text
MetricRecord
AnalyticsSnapshot
```

This prevents large documents and allows time-series querying.

---

# 52. Large Document Protection

Avoid MongoDB documents approaching the BSON document size limit.

Do not embed:

- Large videos
- Large images
- Full document libraries
- Huge research reports
- Unlimited agent execution logs
- Unlimited analytics history

Use references/object storage/separate collections.

---

# 53. Agent Run Retention

Agent runs can become extremely large.

Recommended architecture:

```text
AgentRun
   │
   ├── summary
   ├── status
   ├── cost
   ├── duration
   └── important metadata
```

Detailed traces may eventually move into a dedicated observability system.

MongoDB should retain the application-level execution record.

---

# 54. Security Requirements

## Organization isolation

Every query must enforce:

```ts
organizationId
```

---

## Integration credentials

Never store raw OAuth secrets in normal application documents.

Use:

```text
Secret Manager
       │
       ▼
encrypted token reference
       │
       ▼
IntegrationAccount
```

---

## Auditability

The following actions should generate `AuditLog` records:

- Login/security events
- Integration connection
- Integration disconnection
- Content approval
- Content publication
- Campaign creation
- Campaign modification
- Budget modification
- AI-generated action execution
- Human rejection
- Autonomous action
- Permission change

---

# 55. Required Mongoose Conventions

All schemas should follow:

```ts
import { Schema, model, Types } from 'mongoose';
```

Use:

```ts
Schema.Types.ObjectId
```

for references.

Use:

```ts
timestamps: true
```

for persistent business entities.

Use explicit `enum` definitions.

Use indexes deliberately.

Do not add indexes merely because a field exists.

---

# 56. Recommended Project Structure

```text
src/
└── models/
    │
    ├── identity/
    │   ├── User.model.ts
    │   ├── Organization.model.ts
    │   └── OrganizationMembership.model.ts
    │
    ├── business/
    │   ├── Company.model.ts
    │   ├── Product.model.ts
    │   ├── Persona.model.ts
    │   ├── BrandProfile.model.ts
    │   └── MarketingGoal.model.ts
    │
    ├── research/
    │   ├── Competitor.model.ts
    │   ├── ResearchSource.model.ts
    │   ├── ResearchReport.model.ts
    │   └── Keyword.model.ts
    │
    ├── strategy/
    │   └── MarketingStrategy.model.ts
    │
    ├── content/
    │   ├── Content.model.ts
    │   ├── ContentAsset.model.ts
    │   └── ContentCalendar.model.ts
    │
    ├── campaigns/
    │   ├── Campaign.model.ts
    │   └── CampaignAsset.model.ts
    │
    ├── analytics/
    │   ├── AnalyticsSnapshot.model.ts
    │   └── MetricRecord.model.ts
    │
    ├── agents/
    │   ├── AgentTask.model.ts
    │   ├── AgentRun.model.ts
    │   ├── AgentMemory.model.ts
    │   └── AgentLearning.model.ts
    │
    ├── optimization/
    │   └── Recommendation.model.ts
    │
    ├── experiments/
    │   ├── Experiment.model.ts
    │   ├── ExperimentVariant.model.ts
    │   └── ExperimentResult.model.ts
    │
    ├── approvals/
    │   └── Approval.model.ts
    │
    ├── integrations/
    │   ├── Integration.model.ts
    │   ├── IntegrationAccount.model.ts
    │   └── IntegrationSync.model.ts
    │
    ├── knowledge/
    │   ├── KnowledgeDocument.model.ts
    │   └── KnowledgeChunk.model.ts
    │
    └── audit/
        └── AuditLog.model.ts
```

---

# 57. Final Model Dependency Order

When implementing the schemas, use this order.

```text
1. User
2. Organization
3. OrganizationMembership

4. Company
5. Product
6. Persona
7. BrandProfile
8. MarketingGoal

9. ResearchSource
10. Competitor
11. Keyword
12. ResearchReport

13. MarketingStrategy

14. ContentAsset
15. Content
16. ContentCalendar

17. Campaign
18. CampaignAsset

19. AnalyticsSnapshot
20. MetricRecord

21. AgentTask
22. AgentRun
23. AgentMemory
24. AgentLearning

25. Recommendation

26. Experiment
27. ExperimentVariant
28. ExperimentResult

29. Approval

30. Integration
31. IntegrationAccount
32. IntegrationSync

33. KnowledgeDocument
34. KnowledgeChunk

35. AuditLog
```

---

# 58. MVP Schema Set

Although the final architecture contains all of the models above, the first implementation should NOT require every model.

The initial production MVP can begin with:

```text
User
Organization
OrganizationMembership

Company
Product
Persona
BrandProfile
MarketingGoal

ResearchSource
ResearchReport
Competitor

MarketingStrategy

Content
ContentAsset
ContentCalendar

AgentTask
AgentRun

KnowledgeDocument
KnowledgeChunk

Approval
AuditLog
```

Then add:

```text
Campaign
AnalyticsSnapshot
MetricRecord
Recommendation
```

followed by:

```text
Experiment
ExperimentVariant
ExperimentResult
AgentLearning
```

and finally the deeper integration models.

---

# 59. Final Architecture Mapping

The schema architecture maps directly to the product architecture:

```text
                    B2B MARKETING AI
                           │
                           ▼
                    AGENT ORCHESTRATOR
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
   RESEARCH             STRATEGY             CONTENT
       │                   │                    │
       ▼                   ▼             ┌──────┼──────┐
ResearchReport       MarketingStrategy    Text Graphic Video
       │                                      │
       │                                      ▼
       │                               ContentAsset
       │                                      │
       └──────────────────────────────────────┘
                           │
                           ▼
                       CAMPAIGN
                           │
                           ▼
                       EXECUTION
                           │
                           ▼
                       ANALYTICS
                           │
                           ▼
                     OPTIMIZATION
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Recommendation             Experiment
              │                         │
              └────────────┬────────────┘
                           ▼
                     AgentLearning
                           │
                           ▼
                     Future Strategy
```

---

# 60. Final Principle

The database is not simply a storage layer.

It represents the agent's **long-term organizational memory**.

The most important flow is:

```text
Company Knowledge
       ↓
Research
       ↓
Strategy
       ↓
Content
       ↓
Campaign
       ↓
Execution
       ↓
Analytics
       ↓
Recommendation
       ↓
Experiment
       ↓
Learning
       ↓
Company Knowledge / Strategy
```

This creates the persistent feedback loop required for the system to evolve from an AI assistant into a genuine B2B marketing agent.

**This document should be treated as the canonical schema contract.** Changes to models should be made deliberately and reflected here before implementation.