import { EnrichedStrategyContext } from './strategy.context.service';
import { StrategicAnalysisResult } from './strategy.analysis.service';
import {
  StrategyDecision,
  MarketingStrategyPayload,
  IdealCustomerProfile,
  BuyerPersona,
  PositioningStrategy,
  MessagingFramework,
  FunnelStageStrategy,
  ChannelRecommendation,
  ContentPillar,
  CampaignPlan,
  KpiTarget,
  BudgetRecommendation,
} from './strategy.types';

export class StrategyGenerationService {
  public generate(
    context: EnrichedStrategyContext,
    analysis: StrategicAnalysisResult,
    decisions: StrategyDecision[],
    strategyId: string,
    version: number = 1
  ): MarketingStrategyPayload {
    const brief = context.brief;

    // 1. ICP
    const icp: IdealCustomerProfile = {
      companySize: '50 - 500 employees',
      industry: brief.targetMarket?.industries?.length
        ? brief.targetMarket.industries
        : ['B2B SaaS', 'Technology Services', 'Enterprise Software'],
      geography: brief.targetMarket?.countries?.length
        ? brief.targetMarket.countries
        : ['North America', 'Europe', 'India'],
      revenueRange: '$5M - $50M ARR',
      technologyMaturity: 'Moderate to High (Uses CRM, Marketing Automation)',
      painPoints: [
        'High agency retainers with unpredictable output',
        'Lack of factual accuracy and auditable reasoning in AI content',
        'Long turnaround time for marketing campaign iterations',
      ],
      buyingTriggers: [
        'Mandate to scale marketing output without increasing headcount',
        'Inability to measure factual attribution from current generative tools',
      ],
      decisionMakers: ['Chief Marketing Officer (CMO)', 'VP of Marketing', 'Head of Growth'],
    };

    // 2. Buyer Personas
    const buyerPersonas: BuyerPersona[] = [
      {
        name: 'Strategic CMO Sarah',
        type: 'Decision Maker',
        role: 'Chief Marketing Officer',
        responsibilities: ['Brand positioning', 'Pipeline allocation', 'Budget efficiency'],
        goals: ['Increase verified inbound pipeline', 'Maintain strict brand guideline compliance'],
        painPoints: ['Hallucinating AI outputs damaging brand credibility', 'Scattered multi-tool workflows'],
        objections: ['Can this tool adhere to our strict corporate compliance guidelines?'],
        buyingMotivation: ['End-to-end auditability and enterprise-grade consistency'],
        preferredContent: ['ROI Benchmarks', 'Executive Whitepapers', 'High-level Video Demos'],
      },
      {
        name: 'Growth Lead Alex',
        type: 'Influencer',
        role: 'Growth Marketing Manager',
        responsibilities: ['Funnel conversion', 'Campaign execution', 'Performance ads'],
        goals: ['Launch multi-channel campaigns faster', 'Reduce CAC'],
        painPoints: ['Writing distinct copy for multiple personas manually takes weeks'],
        objections: ['Will the generated copy sound robotic or generic?'],
        buyingMotivation: ['Pre-integrated research and evidence citations in messaging'],
        preferredContent: ['Interactive Product Tours', 'Teardowns', 'Case Studies'],
      },
    ];

    // 3. Positioning
    const positioning: PositioningStrategy = {
      positioningStatement: `For growth-stage B2B enterprises needing rigorous marketing output, ${context.companyContext.name} is the autonomous strategy and creative engine that converts research and corporate knowledge into verified campaigns, unlike generic LLM wrappers that produce hallucinated claims.`,
      targetAudience: 'B2B Enterprise Marketing Leaders',
      problemSolved: 'Eliminates ungrounded AI marketing generation by grounding every decision in factual market intelligence.',
      valueProposition: 'Auditable, Evidence-Driven Marketing Intelligence & Execution',
      differentiators: [
        'Direct citation and claim-linking to original research data',
        'Native versioning and change-tracking rationale',
        'Enterprise RAG grounded strictly in approved company knowledge',
      ],
      competitivePosition: 'Premium Strategic Marketing Intelligence Engine',
    };

    // 4. Messaging Framework
    const messagingFramework: MessagingFramework = {
      coreMessage: 'Marketing strategy and execution powered by verified market truth.',
      valueProposition: positioning.valueProposition,
      painBasedMessages: [
        'Stop gambling your brand reputation on generic, unverified AI content.',
        'Eliminate the 3-week delay between market research and campaign execution.',
      ],
      benefitMessages: [
        'Generate auditable, board-ready marketing strategies in minutes.',
        'Empower lean marketing teams to execute multi-channel campaigns with enterprise rigor.',
      ],
      proofMessages: context.companyContext.allowedClaims,
      personaSpecificMessages: [
        {
          personaType: 'Decision Maker',
          message: 'Ensure 100% brand guideline adherence with verifiable research-backed marketing decisions.',
        },
        {
          personaType: 'Influencer',
          message: 'Cut campaign drafting cycles from weeks to minutes without sacrificing factual depth.',
        },
      ],
    };

    // 5. Funnel Strategy
    const funnel: FunnelStageStrategy[] = [
      {
        stage: 'AWARENESS',
        goal: 'Educate audience on the pitfalls of hallucinated, unverified AI in enterprise marketing.',
        audience: 'B2B Marketing Executives & Growth Teams',
        message: 'Why black-box AI marketing is failing modern B2B standards.',
        content: ['Thought Leadership Carousel Posts', 'Short-form Explainer Reels/Shorts', 'Industry Research Reports'],
        channels: ['LinkedIn', 'Instagram'],
        cta: 'Download the 2026 AI Marketing Reliability Report',
        kpis: ['Impressions', 'Profile Visits', 'Report Downloads'],
      },
      {
        stage: 'CONSIDERATION',
        goal: 'Demonstrate our verified research-to-strategy engine and audit capabilities.',
        audience: 'CMOs, VPs of Marketing, Growth Leads',
        message: 'See how each marketing decision connects directly to live competitive evidence.',
        content: ['Interactive Platform Tours', 'Teardown Webinars', 'Customer Impact Case Studies'],
        channels: ['Email', 'LinkedIn', 'YouTube'],
        cta: 'Watch Product Walkthrough',
        kpis: ['Video Retention Rate', 'Email Click-Through Rate', 'Demo Inquiries'],
      },
      {
        stage: 'CONVERSION',
        goal: 'Drive scheduled architecture consultations and pilot enterprise rollouts.',
        audience: 'Active Evaluation Committees & Decision Makers',
        message: 'Start generating evidence-backed marketing campaigns for your brand today.',
        content: ['Custom ROI Calculators', 'Pilot Onboarding Roadmaps', 'Security & SOC2 Briefings'],
        channels: ['Direct Sales Inbound', 'Executive Demo Calls'],
        cta: 'Book Enterprise Consultation',
        kpis: ['Sales Qualified Leads (SQL)', 'Pilot Conversion Rate', 'Customer Acquisition Cost (CAC)'],
      },
      {
        stage: 'RETENTION',
        goal: 'Maximize weekly strategy version iterations and ongoing content pipeline generation.',
        audience: 'Active Marketing Teams on Platform',
        message: 'Continuous market tracking updates your strategy as competitors shift.',
        content: ['Monthly Strategy Delta Audits', 'Feature Release Notes', 'Best Practices Masterclasses'],
        channels: ['In-App Notifications', 'Dedicated Slack Channels', 'Customer Success Reviews'],
        cta: 'Review New Strategy Version',
        kpis: ['Monthly Active Users (MAU)', 'Strategy Version Iteration Frequency', 'Net Revenue Retention (NRR)'],
      },
    ];

    // 6. Channel Strategy
    const channelStrategy: ChannelRecommendation[] = [
      {
        channel: 'LinkedIn',
        priority: 'high',
        rationale: 'Primary gathering hub for B2B enterprise decision makers and marketing executives.',
        targetStage: ['AWARENESS', 'CONSIDERATION'],
        contentFormats: ['Executive Thought Leadership', 'Data Carousels', 'Polls & Teardowns'],
      },
      {
        channel: 'Instagram',
        priority: 'high',
        rationale: 'High-impact visual channel for UI walkthroughs, short-form video proof, and brand authority.',
        targetStage: ['AWARENESS'],
        contentFormats: ['Short-form Reels', 'Product Architecture Infographics', 'Behind-the-scenes Workflow Clips'],
      },
      {
        channel: 'Google Search & SEO',
        priority: 'medium',
        rationale: 'Captures high-intent prospects searching for AI marketing governance and strategy automation.',
        targetStage: ['CONSIDERATION', 'CONVERSION'],
        contentFormats: ['Comparison Articles', 'Technical Architecture Documentation', 'Landing Pages'],
      },
    ];

    // 7. Content Pillars
    const contentPillars: ContentPillar[] = [
      {
        pillarName: 'Industry Education & Market Truth',
        description: 'Deep dives into modern B2B marketing hurdles, AI accuracy, and research methodologies.',
        subTopics: ['The hallucination problem in B2B copy', 'How evidence-linking changes marketing attribution'],
        intendedChannels: ['LinkedIn', 'Instagram'],
        targetPersonas: ['Strategic CMO Sarah', 'Growth Lead Alex'],
      },
      {
        pillarName: 'Product Architecture & Auditability',
        description: 'Showcasing the multi-agent system, context builder, and verifiable decision logic.',
        subTopics: ['Behind the scenes of our Strategy Agent', 'How RAG groundings protect brand integrity'],
        intendedChannels: ['Instagram', 'LinkedIn', 'YouTube'],
        targetPersonas: ['Growth Lead Alex'],
      },
      {
        pillarName: 'Customer Success & Quantitative Proof',
        description: 'Real-world case studies demonstrating efficiency gains and pipeline acceleration.',
        subTopics: ['How Enterprise X cut campaign launch time by 60%', 'Auditable strategy vs prompt wrappers'],
        intendedChannels: ['LinkedIn', 'Email'],
        targetPersonas: ['Strategic CMO Sarah'],
      },
    ];

    // 8. Campaign Strategy
    const campaignStrategy: CampaignPlan[] = [
      {
        name: 'The Auditable AI Movement',
        objective: 'brand_awareness',
        audience: 'Enterprise Marketing Leaders',
        coreMessage: 'Never publish unverified AI marketing content again.',
        offer: 'Complimentary Strategic AI Readiness Audit',
        channels: ['LinkedIn', 'Instagram'],
        contentDeliverables: ['5 Video Reels', '3 Carousel Posts', '1 Diagnostic Benchmark Checklist'],
        timeline: 'Weeks 1 - 4',
        kpis: ['250k Combined Impressions', '1,500 Diagnostic Downloads'],
      },
    ];

    // 9. KPIs
    const kpis: KpiTarget[] = [
      {
        category: 'Awareness',
        metric: 'Combined Social Reach (LinkedIn + Instagram)',
        targetValue: '150,000 Impressions/month',
        timeframe: 'Month 1 - Month 3',
      },
      {
        category: 'Acquisition',
        metric: 'Inbound Strategy Consultation Requests',
        targetValue: '45 Qualified Inquiries/month',
        timeframe: 'Month 2 onwards',
      },
      {
        category: 'Engagement',
        metric: 'Average Reel / Post Save & Share Rate',
        targetValue: '> 4.5%',
        timeframe: 'Ongoing',
      },
    ];

    // 10. Budget Recommendations
    const totalBudget = brief.budget?.amount || 5000;
    const isEstimated = !brief.budget?.amount;

    const budgetRecommendations: BudgetRecommendation = {
      totalEstimatedBudget: totalBudget,
      currency: brief.budget?.currency || 'USD',
      isEstimated,
      allocations: {
        paidAdvertising: Math.round(totalBudget * 0.45),
        contentProduction: Math.round(totalBudget * 0.25),
        influencerPartnerships: Math.round(totalBudget * 0.1),
        toolsAndSoftware: Math.round(totalBudget * 0.1),
        experiments: Math.round(totalBudget * 0.1),
      },
    };

    return {
      organizationId: brief.organizationId,
      strategyId,
      version,
      status: 'active',
      icp,
      buyerPersonas,
      positioning,
      messagingFramework,
      funnel,
      channelStrategy,
      contentPillars,
      campaignStrategy,
      kpis,
      budgetRecommendations,
      decisions,
    };
  }
}