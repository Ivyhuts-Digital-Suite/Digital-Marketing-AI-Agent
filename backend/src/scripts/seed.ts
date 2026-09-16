import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db";
import User from "../models/User";
import Organization from "../models/Organization";
import OrganizationMembership from "../models/OrganizationMembership";
import CompanyIntelligence from "../models/CompanyIntelligence";
import BrandProfile from "../models/BrandProfile";
import Product from "../models/Product";
import ContentPlan from "../models/ContentPlan";
import ContentItem, { IContentItem } from "../models/ContentItem";
import { StrategyModel } from "../modules/strategy/strategy.schema";
import { generateUniqueOrganizationSlug } from "../utils/slug";

/**
 * Development demo seed - NOT run automatically. Run explicitly with:
 *
 *   npm run seed
 *
 * Idempotent: every entity is looked up by a stable natural key first
 * (email, slug, strategyId, a seed tag on the content plan) and only
 * created if missing, so running this repeatedly never duplicates data.
 *
 * DEV-ONLY CREDENTIALS - never use these in production, never document
 * them outside development contexts:
 *   email:    demo@growthforge.test
 *   password: GrowthForge-Demo-2026!
 */

const DEMO_EMAIL = "demo@growthforge.test";
const DEMO_PASSWORD = "GrowthForge-Demo-2026!";
const DEMO_ORG_SLUG = "growthforge";
const CONTENT_PLAN_SEED_TAG = "growthforge-demo-content-plan-v1";
const STRATEGY_SEED_ID = "growthforge-demo-strategy-v1";

function guardEnvironment(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitlyAllowed = process.env.SEED_ALLOW_PRODUCTION === "true";

  if (isProduction && !explicitlyAllowed) {
    console.error(
      "Refusing to run the demo seed: NODE_ENV=production. This seed creates clearly-labeled fictional demo data " +
        "(GrowthForge / demo@growthforge.test) with a published development password - it must never run against a " +
        "real production database. Set SEED_ALLOW_PRODUCTION=true only if you are certain this is not a real " +
        "production environment."
    );
    process.exit(1);
  }
}

async function seedUserOrganizationAndMembership() {
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({ name: "Demo User", email: DEMO_EMAIL, password: hashedPassword });
    console.log(`  created demo user (${DEMO_EMAIL})`);
  } else {
    console.log(`  demo user already exists (${DEMO_EMAIL})`);
  }

  let organization = await Organization.findOne({ slug: DEMO_ORG_SLUG });
  if (!organization) {
    const slug = await generateUniqueOrganizationSlug("GrowthForge");
    organization = await Organization.create({
      name: "GrowthForge",
      slug,
      description:
        "A fictional B2B SaaS company providing an AI-powered digital marketing platform that helps growing " +
        "businesses plan, create, and optimize marketing campaigns.",
      website: "https://growthforge.example",
      industry: "B2B SaaS / Digital Marketing Technology",
      size: "11-50",
    });
    console.log("  created organization (GrowthForge)");
  } else {
    console.log("  organization already exists (GrowthForge)");
  }

  const existingMembership = await OrganizationMembership.findOne({
    userId: user._id,
    organizationId: organization._id,
  });
  if (!existingMembership) {
    await OrganizationMembership.create({ userId: user._id, organizationId: organization._id, role: "owner" });
    console.log("  created membership (Demo User -> GrowthForge, owner)");
  } else {
    console.log("  membership already exists (Demo User -> GrowthForge, owner)");
  }

  return { user, organization };
}

async function seedCompanyIntelligence(organizationId: mongoose.Types.ObjectId) {
  const sourceReferences = [{ sourceType: "onboarding" as const, label: "Demo seed data" }];

  let product = await Product.findOne({ organizationId, name: "GrowthForge Platform" });
  if (!product) {
    product = await Product.create({
      organizationId,
      name: "GrowthForge Platform",
      description:
        "An AI-powered digital marketing platform that turns business intelligence and marketing strategy into " +
        "high-quality content and campaigns.",
      targetAudience: "B2B SaaS founders, marketing managers, and growth teams at small and mid-sized businesses",
      problemsSolved: [
        "Marketing content that isn't grounded in a real strategy",
        "Slow, manual campaign planning",
        "Disconnected tools between strategy, content planning, and creative production",
      ],
      benefits: ["Faster marketing planning", "Integrated strategy and content workflows", "AI-powered marketing workflows"],
      differentiators: ["Strategy before content generation", "Instagram-first content execution"],
      sourceReferences,
    });
    console.log("  created product (GrowthForge Platform)");
  } else {
    console.log("  product already exists (GrowthForge Platform)");
  }

  const companyIntelligenceData = {
    companyOverview:
      "GrowthForge helps B2B companies turn business intelligence and marketing strategy into high-quality content " +
      "and campaigns using AI.",
    industry: "B2B SaaS / Digital Marketing Technology",
    targetCustomers: ["B2B SaaS founders", "Marketing managers", "Growth teams", "Small and mid-sized businesses"],
    customerProblems: [
      "Marketing content produced without a clear strategy behind it",
      "Manual, slow campaign and content planning",
      "Fragmented tools across strategy, planning, and content production",
    ],
    products: [product._id],
    services: [],
    differentiators: [
      "AI-driven marketing intelligence",
      "Strategy before content generation",
      "Instagram-first content execution",
      "Integrated content planning and creative production",
    ],
    competitors: [],
    valuePropositions: [
      "Plan, create, and optimize marketing campaigns from one platform",
      "Every piece of content traces back to a real strategy",
    ],
    brandVoice: "Strategic, modern, confident, clear, and helpful",
    marketingMessaging: [
      "AI-powered marketing workflows",
      "Faster marketing planning",
      "Integrated strategy and content workflows",
    ],
    allowedClaims: ["AI-powered marketing workflows", "Faster marketing planning", "Integrated strategy and content workflows"],
    forbiddenClaims: ["Guaranteed revenue growth", "Guaranteed viral content", "Guaranteed ROI"],
    importantFacts: ["GrowthForge is Instagram-first for content execution."],
    sourceReferences,
    generatedAt: new Date(),
  };

  const existingCompanyIntelligence = await CompanyIntelligence.findOne({ organizationId });
  await CompanyIntelligence.findOneAndUpdate(
    { organizationId },
    { $set: companyIntelligenceData, $setOnInsert: { organizationId, version: 1 } },
    { upsert: true }
  );
  console.log(existingCompanyIntelligence ? "  company intelligence already exists" : "  created company intelligence");

  const brandProfileData = {
    brandVoice: "Strategic, modern, confident, clear, and helpful",
    tone: "Confident and clear",
    preferredMessagingStyle: "Direct, benefit-led, strategy-first",
    targetAudience: ["B2B SaaS founders", "Marketing managers", "Growth teams", "Small and mid-sized businesses"],
    positioning: "The AI marketing platform that puts strategy before content.",
    keyMessaging: ["AI-powered marketing workflows", "Faster marketing planning", "Integrated strategy and content workflows"],
    allowedClaims: ["AI-powered marketing workflows", "Faster marketing planning", "Integrated strategy and content workflows"],
    forbiddenClaims: ["Guaranteed revenue growth", "Guaranteed viral content", "Guaranteed ROI"],
    sourceReferences,
    generatedAt: new Date(),
  };

  const existingBrandProfile = await BrandProfile.findOne({ organizationId });
  await BrandProfile.findOneAndUpdate(
    { organizationId },
    { $set: brandProfileData, $setOnInsert: { organizationId } },
    { upsert: true }
  );
  console.log(existingBrandProfile ? "  brand profile already exists" : "  created brand profile");
}

async function seedStrategy(organizationId: string) {
  const existing = await StrategyModel.findOne({ strategyId: STRATEGY_SEED_ID });
  if (existing) {
    console.log("  strategy already exists (growthforge-demo-strategy-v1)");
    return;
  }

  await StrategyModel.create({
    organizationId,
    strategyId: STRATEGY_SEED_ID,
    version: 1,
    status: "active",
    icp: {
      companySize: "11-200 employees",
      industry: ["B2B SaaS", "Digital Marketing Technology"],
      geography: ["United States", "United Kingdom", "Canada"],
      revenueRange: "$1M-$20M ARR",
      technologyMaturity: "Growth-stage, already using marketing/sales tooling",
      painPoints: [
        "Marketing content isn't grounded in a real strategy",
        "Campaign planning is slow and manual",
        "Tools for strategy, content, and creative production are disconnected",
      ],
      buyingTriggers: ["Hiring a first dedicated marketing lead", "Missed pipeline targets from inconsistent content output"],
      decisionMakers: ["VP Marketing", "Head of Growth", "Founder/CEO at smaller companies"],
    },
    buyerPersonas: [
      {
        name: "Maya, Marketing Manager",
        type: "Decision Maker",
        role: "Marketing Manager",
        responsibilities: ["Owns the content calendar", "Reports on campaign performance"],
        goals: ["Ship more content without sacrificing strategy", "Prove marketing's contribution to pipeline"],
        painPoints: ["Not enough time to plan strategically", "Content feels reactive, not intentional"],
        objections: ["Will AI-generated content sound generic?"],
        buyingMotivation: ["Faster planning", "Confidence that content ladders up to strategy"],
        preferredContent: ["Instagram carousel", "Instagram reel"],
      },
      {
        name: "Devon, Growth Lead",
        type: "Influencer",
        role: "Head of Growth",
        responsibilities: ["Owns growth experiments", "Coordinates across marketing and product"],
        goals: ["Increase qualified pipeline", "Reduce time-to-launch for campaigns"],
        painPoints: ["Disconnected tools slow down execution"],
        objections: ["Another point solution to manage"],
        buyingMotivation: ["An integrated strategy-to-content workflow"],
        preferredContent: ["Instagram post", "Instagram story"],
      },
    ],
    positioning: {
      positioningStatement:
        "For growing B2B companies, GrowthForge is the AI marketing platform that turns strategy into content - " +
        "unlike generic AI writing tools, GrowthForge starts with strategy, not a blank prompt.",
      targetAudience: "B2B SaaS founders, marketing managers, and growth teams at small and mid-sized businesses",
      problemSolved: "Marketing content produced without a clear strategy behind it",
      valueProposition: "Plan, create, and optimize marketing campaigns from one platform, grounded in real strategy",
      differentiators: ["Strategy before content generation", "Instagram-first content execution"],
      competitivePosition: "The strategy-first alternative to generic AI content generators",
    },
    messagingFramework: {
      coreMessage: "Strategy before content.",
      valueProposition: "AI-powered marketing workflows that turn strategy into content and campaigns.",
      painBasedMessages: [
        "Still generating content without a strategy behind it?",
        "Marketing planning shouldn't take longer than the campaign itself.",
      ],
      benefitMessages: ["Faster marketing planning", "Integrated strategy and content workflows"],
      proofMessages: ["Built for B2B teams who plan before they publish"],
      personaSpecificMessages: [
        { personaType: "Marketing Manager", message: "Get a finalized content calendar in minutes, not weeks." },
        { personaType: "Growth Lead", message: "One workflow from strategy to creative production." },
      ],
    },
    funnel: [
      {
        stage: "AWARENESS",
        goal: "Introduce the strategy-first approach to marketing content",
        audience: "Marketing managers and growth teams evaluating AI content tools",
        message: "Most AI-generated marketing content fails because it skips strategy.",
        content: ["Instagram post", "Instagram reel"],
        channels: ["instagram"],
        cta: "Learn more",
        kpis: ["Reach", "Engagement rate"],
      },
      {
        stage: "CONSIDERATION",
        goal: "Show how the workflow connects strategy to content",
        audience: "Marketing managers actively evaluating tools",
        message: "See how a finalized content calendar turns into creative assets.",
        content: ["Instagram carousel"],
        channels: ["instagram"],
        cta: "See how it works",
        kpis: ["Saves", "Click-through rate"],
      },
    ],
    channelStrategy: [
      {
        channel: "instagram",
        priority: "high",
        rationale: "Primary channel for demonstrating the product's Instagram-first content execution",
        targetStage: ["AWARENESS", "CONSIDERATION"],
        contentFormats: ["instagram_post", "instagram_carousel", "instagram_reel", "instagram_story"],
      },
    ],
    contentPillars: [
      {
        pillarName: "Strategy Education",
        description: "Teaching why strategy must come before content creation",
        subTopics: ["Why AI content fails without strategy", "Content planning mistakes"],
        intendedChannels: ["instagram"],
        targetPersonas: ["Maya, Marketing Manager"],
      },
      {
        pillarName: "Product Education",
        description: "Showing how the GrowthForge workflow actually works",
        subTopics: ["Behind the scenes of the AI workflow", "From research to Reel"],
        intendedChannels: ["instagram"],
        targetPersonas: ["Devon, Growth Lead"],
      },
      {
        pillarName: "Thought Leadership",
        description: "Positioning GrowthForge's point of view on AI in marketing",
        subTopics: ["Marketing myths vs reality", "AI does not replace strategy"],
        intendedChannels: ["instagram"],
        targetPersonas: ["Maya, Marketing Manager", "Devon, Growth Lead"],
      },
    ],
    campaignStrategy: [
      {
        name: "Strategy Before Content Launch",
        objective: "brand_awareness",
        audience: "B2B marketing managers and growth teams",
        coreMessage: "Strategy before content.",
        offer: "Free content calendar walkthrough",
        channels: ["instagram"],
        contentDeliverables: ["3 posts", "2 carousels", "2 reels", "1 story"],
        timeline: "2 weeks",
        kpis: ["Reach", "Engagement rate", "Click-through rate"],
      },
    ],
    kpis: [
      { category: "Awareness", metric: "Reach", targetValue: "50,000 accounts", timeframe: "Monthly" },
      { category: "Engagement", metric: "Engagement rate", targetValue: "4%", timeframe: "Monthly" },
      { category: "Acquisition", metric: "Content-attributed sign-ups", targetValue: "30", timeframe: "Monthly" },
    ],
    budgetRecommendations: {
      totalEstimatedBudget: 5000,
      currency: "USD",
      isEstimated: true,
      allocations: {
        paidAdvertising: 2000,
        contentProduction: 2000,
        influencerPartnerships: 0,
        toolsAndSoftware: 500,
        experiments: 500,
      },
    },
    decisions: [
      {
        category: "Positioning",
        decision: "Lead with 'strategy before content' as the core differentiator",
        rationale: "Directly addresses the target audience's top pain point: content without strategic grounding",
        evidence: { sourceType: "business_goal", claim: "Differentiate from generic AI content generators" },
        confidence: 0.8,
      },
    ],
  });

  console.log("  created strategy (growthforge-demo-strategy-v1)");
}

interface SeedContentItemInput {
  topic: string;
  angle: string;
  hook: string;
  message: string;
  keyPoints: string[];
  cta: string;
  contentPillar: string;
  funnelStage: IContentItem["funnelStage"];
  goal: IContentItem["goal"];
  format: IContentItem["format"];
  daysFromNow: number;
}

const CONTENT_ITEMS: SeedContentItemInput[] = [
  {
    topic: "Why most AI-generated marketing content fails",
    angle: "Contrarian - the problem isn't AI, it's skipping strategy",
    hook: "Most AI-generated marketing content fails for one reason.",
    message: "AI content fails when it skips strategy - GrowthForge starts with strategy, not a blank prompt.",
    keyPoints: [
      "Generic prompts produce generic content",
      "Content without an audience or funnel stage in mind rarely converts",
      "Strategy-first content consistently outperforms prompt-first content",
    ],
    cta: "See how strategy-first content works",
    contentPillar: "Strategy Education",
    funnelStage: "awareness",
    goal: "increase_awareness",
    format: "instagram_post",
    daysFromNow: 0,
  },
  {
    topic: "Strategy before content: the GrowthForge philosophy",
    angle: "Educational - explain the core product philosophy",
    hook: "Here's why we build content calendars backwards.",
    message: "GrowthForge plans strategy first, then builds the content calendar - never the other way around.",
    keyPoints: [
      "Company intelligence and strategy come first",
      "The content calendar is the source of truth for creative production",
      "Every piece of content traces back to a real business goal",
    ],
    cta: "Explore the workflow",
    contentPillar: "Strategy Education",
    funnelStage: "awareness",
    goal: "build_authority",
    format: "instagram_carousel",
    daysFromNow: 2,
  },
  {
    topic: "5 signs your marketing workflow is broken",
    angle: "Listicle - diagnostic content for the target persona's pain points",
    hook: "5 signs your marketing workflow is broken.",
    message: "A disconnected marketing workflow quietly costs you time, consistency, and pipeline.",
    keyPoints: [
      "Content is planned in one tool, written in another, and designed in a third",
      "No one can explain why a piece of content was made",
      "Campaigns launch late because planning takes too long",
      "Content calendars exist but nobody follows them",
      "There's no way to trace results back to strategy",
    ],
    cta: "Fix your workflow",
    contentPillar: "Strategy Education",
    funnelStage: "consideration",
    goal: "generate_leads",
    format: "instagram_carousel",
    daysFromNow: 4,
  },
  {
    topic: "Behind the scenes: how our AI plans a campaign",
    angle: "Behind-the-scenes product walkthrough",
    hook: "Ever wondered how an AI actually plans a marketing campaign?",
    message: "Watch how GrowthForge turns company intelligence and strategy into a finalized content calendar.",
    keyPoints: [
      "Company intelligence grounds every decision in real facts",
      "Strategy defines audience, funnel stage, and channels",
      "The content calendar becomes the source of truth",
    ],
    cta: "Watch the full workflow",
    contentPillar: "Product Education",
    funnelStage: "awareness",
    goal: "increase_engagement",
    format: "instagram_reel",
    daysFromNow: 6,
  },
  {
    topic: "From research to Reel in one workflow",
    angle: "Product demonstration - speed and integration",
    hook: "From research to a finished Reel - without switching tools.",
    message: "GrowthForge connects research, strategy, and creative production into a single workflow.",
    keyPoints: [
      "Research and strategy inform every content decision",
      "Creative briefs translate strategy into visual direction",
      "Motion graphics are generated straight from the approved brief",
    ],
    cta: "See the full pipeline",
    contentPillar: "Product Education",
    funnelStage: "consideration",
    goal: "generate_leads",
    format: "instagram_reel",
    daysFromNow: 8,
  },
  {
    topic: "Marketing myth vs reality: \"more content = more growth\"",
    angle: "Myth vs reality format",
    hook: "Myth: more content always means more growth.",
    message: "Volume without strategy doesn't move pipeline - relevance and consistency do.",
    keyPoints: [
      "Posting more without a strategy just creates more noise",
      "Consistent, strategy-aligned content compounds over time",
    ],
    cta: "Build a real content strategy",
    contentPillar: "Thought Leadership",
    funnelStage: "awareness",
    goal: "build_authority",
    format: "instagram_post",
    daysFromNow: 10,
  },
  {
    topic: "The 3 content planning mistakes costing you leads",
    angle: "Listicle - direct, actionable",
    hook: "3 content planning mistakes that are quietly costing you leads.",
    message: "Most lead-generation content problems trace back to planning, not execution.",
    keyPoints: [
      "Planning content around trends instead of funnel stage",
      "Skipping a creative brief before generating assets",
      "Never finalizing the calendar before production starts",
    ],
    cta: "Plan it right the first time",
    contentPillar: "Strategy Education",
    funnelStage: "consideration",
    goal: "generate_leads",
    format: "instagram_carousel",
    daysFromNow: 12,
  },
  {
    topic: "AI does not replace strategy - it executes it",
    angle: "Thought leadership - product philosophy as a stance",
    hook: "AI doesn't replace strategy. It executes it.",
    message: "GrowthForge's AI generates creative and content - the strategy behind it is still deliberate and reviewed.",
    keyPoints: ["AI accelerates execution, not decision-making", "Every generated asset traces back to an approved brief"],
    cta: "See strategy-led AI in action",
    contentPillar: "Thought Leadership",
    funnelStage: "awareness",
    goal: "build_authority",
    format: "instagram_story",
    daysFromNow: 13,
  },
  {
    topic: "What a finalized content calendar actually unlocks",
    angle: "Product education - the finalize step specifically",
    hook: "Finalizing your content calendar unlocks more than you'd think.",
    message: "Once a calendar is finalized, it becomes the single source of truth driving every generated asset.",
    keyPoints: [
      "No more content created outside the plan",
      "Every graphic and video traces back to an approved content item",
    ],
    cta: "Finalize your first calendar",
    contentPillar: "Product Education",
    funnelStage: "consideration",
    goal: "drive_website_traffic",
    format: "instagram_post",
    daysFromNow: 15,
  },
  {
    topic: "How GrowthForge turns a content plan into a Reel",
    angle: "Product demonstration - late funnel, conversion-oriented",
    hook: "Here's exactly how a content plan becomes a finished Reel.",
    message: "From creative brief to script, storyboard, and motion graphic - all traceable back to the strategy.",
    keyPoints: ["Creative briefs define tone and visual direction", "Scripts and storyboards are generated from the brief"],
    cta: "Try it with your own calendar",
    contentPillar: "Product Education",
    funnelStage: "conversion",
    goal: "generate_leads",
    format: "instagram_reel",
    daysFromNow: 17,
  },
];

async function seedContentCalendar(organizationId: mongoose.Types.ObjectId) {
  const existingPlan = await ContentPlan.findOne({ organizationId, "metadata.seedTag": CONTENT_PLAN_SEED_TAG });
  if (existingPlan) {
    console.log("  content plan already exists (growthforge-demo-content-plan-v1) - skipping calendar seed");
    return;
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 18 * 24 * 60 * 60 * 1000);

  const plan = await ContentPlan.create({
    organizationId,
    duration: "2_weeks",
    startDate,
    endDate,
    objectives: ["generate_leads", "increase_awareness"],
    status: "finalized",
    metadata: { seedTag: CONTENT_PLAN_SEED_TAG },
    version: 1,
  });

  await ContentItem.insertMany(
    CONTENT_ITEMS.map((item) => ({
      contentPlanId: plan._id,
      organizationId,
      goal: item.goal,
      persona: { description: "B2B marketing managers and growth teams at small and mid-sized SaaS companies" },
      funnelStage: item.funnelStage,
      contentPillar: item.contentPillar,
      topic: item.topic,
      angle: item.angle,
      channel: "instagram",
      format: item.format,
      hook: item.hook,
      message: item.message,
      keyPoints: item.keyPoints,
      cta: item.cta,
      rationale: `Supports the "${item.contentPillar}" pillar at the ${item.funnelStage} funnel stage.`,
      evidence: [],
      scheduledDate: new Date(startDate.getTime() + item.daysFromNow * 24 * 60 * 60 * 1000),
      status: "draft",
    }))
  );

  console.log(`  created finalized content plan with ${CONTENT_ITEMS.length} content items`);
}

async function main() {
  guardEnvironment();

  await connectDB();

  console.log("Seeding demo data...");

  console.log("User, organization, and membership:");
  const { organization } = await seedUserOrganizationAndMembership();

  console.log("Company intelligence:");
  await seedCompanyIntelligence(organization._id as mongoose.Types.ObjectId);

  console.log("Strategy:");
  await seedStrategy(organization._id.toString());

  console.log("Content calendar:");
  await seedContentCalendar(organization._id as mongoose.Types.ObjectId);

  console.log("\nDone. Demo login:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}  (development only)`);
  console.log(`  organization: GrowthForge (${organization._id})`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
