const mongoose = require("mongoose");
require("dotenv").config();

describe("Experimentation services", () => {
  let generateHypothesisFromFinding;
  let generateVariantContent;
  let determineAssignmentStrategy;
  let evaluateBusinessImpact;
  let findRelatedLearnings, assessEvidenceConsistency;
  let proposeStrategyChangeFromLearning;
  let classifyExperimentRisk;

  let Hypothesis, Experiment, ExperimentVariant, Content, CreativeBrief, AgentLearning, Recommendation;

  let organizationId, companyId;

  beforeAll(async () => {
    require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(process.env.MONGODB_URI);

    // Pure side-effect import — populates modelFactory's "mock" provider
    // before VariantGeneratorService's generateText() call needs it.
    await import("../../src/modules/ai/models/registerModels.js");

    ({ generateHypothesisFromFinding } = await import(
      "../../src/modules/experimentation/services/HypothesisGeneratorService.js"
    ));
    ({ generateVariantContent } = await import(
      "../../src/modules/experimentation/services/VariantGeneratorService.js"
    ));
    ({ determineAssignmentStrategy } = await import(
      "../../src/modules/experimentation/services/AssignmentService.js"
    ));
    ({ evaluateBusinessImpact } = await import(
      "../../src/modules/experimentation/services/BusinessEvaluationService.js"
    ));
    ({ findRelatedLearnings, assessEvidenceConsistency } = await import(
      "../../src/modules/experimentation/services/MarketingMemoryService.js"
    ));
    ({ proposeStrategyChangeFromLearning } = await import(
      "../../src/modules/experimentation/services/StrategyHandoffService.js"
    ));
    ({ classifyExperimentRisk } = await import(
      "../../src/modules/experimentation/services/AutonomyPolicyService.js"
    ));

    ({ default: Hypothesis } = await import("../../src/models/hypothesis.model.js"));
    ({ default: Experiment } = await import("../../src/models/experiment.model.js"));
    ({ default: ExperimentVariant } = await import(
      "../../src/models/experimentVariant.model.js"
    ));
    ({ default: Content } = await import("../../src/models/content.model.js"));
    ({ default: CreativeBrief } = await import("../../src/models/creativeBrief.model.js"));
    ({ default: AgentLearning } = await import("../../src/models/agentLearning.model.js"));
    ({ default: Recommendation } = await import("../../src/models/recommendation.model.js"));

    organizationId = new mongoose.Types.ObjectId();
    companyId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("HypothesisGeneratorService generates a hypothesis from a finding", async () => {
    const result = await generateHypothesisFromFinding({
      organizationId,
      sourceAgentType: "analytics",
      finding: {
        metric: "click_through_rate",
        observation: "CTR dropped 15% over the last 2 weeks",
        possibleCause: "caption_length",
        channel: "instagram",
        contentType: "image",
        audience: "existing_followers",
        category: "content"
      }
    });

    expect(result.success).toBe(true);
    expect(typeof result.hypothesis.statement).toBe("string");
    expect(result.hypothesis.statement.length).toBeGreaterThan(0);

    await Hypothesis.findByIdAndDelete(result.hypothesis._id);
  });

  test("HypothesisGeneratorService rejects an incomplete finding", async () => {
    const result = await generateHypothesisFromFinding({
      organizationId,
      finding: {
        metric: "click_through_rate",
        observation: "CTR dropped 15% over the last 2 weeks"
        // possibleCause intentionally omitted
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("INCOMPLETE_FINDING");
  });

  test("VariantGeneratorService generates real content for a variant", async () => {
    const experimentId = new mongoose.Types.ObjectId();

    const result = await generateVariantContent({
      organizationId,
      companyId,
      experimentId,
      type: "control",
      hook: "Stop scrolling",
      coreMessage: "Our product saves you time",
      cta: "Learn More",
      targetAudience: "existing_followers",
      channel: "instagram",
      format: "post"
    });

    expect(result.success).toBe(true);
    expect(result.variant.contentId).toBeTruthy();
    expect(result.content._id.toString()).toBe(result.variant.contentId.toString());

    const persistedContent = await Content.findById(result.content._id);
    expect(persistedContent).not.toBeNull();

    await ExperimentVariant.findByIdAndDelete(result.variant._id);
    await CreativeBrief.findByIdAndDelete(result.creativeBrief._id);
    await Content.findByIdAndDelete(result.content._id);
  });

  test("AssignmentService distinguishes content cohorts from user-level randomization", () => {
    const organicStrategy = determineAssignmentStrategy({
      channel: "instagram",
      experimentType: "content"
    });
    const adStrategy = determineAssignmentStrategy({
      channel: "meta_ads",
      experimentType: "advertising"
    });

    expect(organicStrategy.strategyType).toBe("content_cohort");
    expect(adStrategy.strategyType).toBe("user_level_randomization");
    expect(organicStrategy.strategyType).not.toBe(adStrategy.strategyType);
  });

  test("BusinessEvaluationService flags high cost as negative despite a positive statistical result", () => {
    const result = evaluateBusinessImpact({
      statisticalResult: { effectSize: 0.01, relativeEffect: 0.2 },
      resultState: "VARIANT_SUPPORTED",
      controlCost: 100,
      variantCost: 400
    });

    expect(result.businessImpact).toBe("negative");
  });

  test("MarketingMemoryService detects mixed evidence across experiments", async () => {
    const hypothesis1 = await Hypothesis.create({
      organizationId,
      statement: "Shorter captions increase CTR on Instagram",
      independentVariable: "caption_length",
      dependentMetric: "click_through_rate",
      channel: "instagram",
      contentType: "image",
      expectedDirection: "increase"
    });
    const hypothesis2 = await Hypothesis.create({
      organizationId,
      statement: "Shorter captions increase CTR on Instagram (replication)",
      independentVariable: "caption_length",
      dependentMetric: "click_through_rate",
      channel: "instagram",
      contentType: "image",
      expectedDirection: "increase"
    });

    const experiment1 = await Experiment.create({
      organizationId,
      name: "Caption length experiment 1",
      hypothesisId: hypothesis1._id,
      primaryMetric: "click_through_rate",
      status: "completed"
    });
    const experiment2 = await Experiment.create({
      organizationId,
      name: "Caption length experiment 2",
      hypothesisId: hypothesis2._id,
      primaryMetric: "click_through_rate",
      status: "completed"
    });

    const positiveLearning = await AgentLearning.create({
      organizationId,
      category: "content",
      statement: "Shorter captions increased CTR by 15%.",
      experimentId: experiment1._id,
      impact: { metric: "click_through_rate", value: 0.01, percentageChange: 15 },
      applicableTo: { channels: ["instagram"], contentTypes: ["image"] },
      confidence: 0.7
    });
    const negativeLearning = await AgentLearning.create({
      organizationId,
      category: "content",
      statement: "Shorter captions decreased CTR by 10%.",
      experimentId: experiment2._id,
      impact: { metric: "click_through_rate", value: -0.005, percentageChange: -10 },
      applicableTo: { channels: ["instagram"], contentTypes: ["image"] },
      confidence: 0.7
    });

    const relatedLearnings = await findRelatedLearnings({
      organizationId,
      channel: "instagram",
      independentVariable: "caption_length"
    });

    expect(relatedLearnings.length).toBe(2);

    const consistency = assessEvidenceConsistency(relatedLearnings);
    expect(consistency.consistency).toBe("mixed");

    await AgentLearning.deleteMany({ _id: { $in: [positiveLearning._id, negativeLearning._id] } });
    await Experiment.deleteMany({ _id: { $in: [experiment1._id, experiment2._id] } });
    await Hypothesis.deleteMany({ _id: { $in: [hypothesis1._id, hypothesis2._id] } });
  });

  test("StrategyHandoffService proposes a change for high-confidence learnings", async () => {
    const learning = await AgentLearning.create({
      organizationId,
      category: "content",
      statement: "Video content strongly outperforms image content on engagement.",
      confidence: 0.9,
      impact: { metric: "engagement_rate", value: 0.05, percentageChange: 40 },
      applicableTo: { channels: ["instagram"], contentTypes: ["video"] }
    });

    const result = await proposeStrategyChangeFromLearning({
      learningId: learning._id,
      category: "content"
    });

    expect(result.success).toBe(true);
    expect(result.recommendation).toBeTruthy();

    const persisted = await Recommendation.findById(result.recommendation._id);
    expect(persisted).not.toBeNull();

    await Recommendation.findByIdAndDelete(result.recommendation._id);
    await AgentLearning.findByIdAndDelete(learning._id);
  });

  test("StrategyHandoffService rejects low-confidence learnings", async () => {
    const learning = await AgentLearning.create({
      organizationId,
      category: "content",
      statement: "Weak signal that carousel posts slightly outperform single-image posts.",
      confidence: 0.4,
      applicableTo: { channels: ["instagram"], contentTypes: ["carousel"] }
    });

    const result = await proposeStrategyChangeFromLearning({
      learningId: learning._id,
      category: "content"
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("INSUFFICIENT_CONFIDENCE");

    await AgentLearning.findByIdAndDelete(learning._id);
  });

  test("AutonomyPolicyService always requires approval regardless of risk level", () => {
    const highRisk = classifyExperimentRisk({
      independentVariable: "ad budget allocation",
      experimentType: "advertising"
    });
    const mediumRisk = classifyExperimentRisk({
      independentVariable: "posting frequency",
      experimentType: "content"
    });
    const lowRisk = classifyExperimentRisk({
      independentVariable: "cta_copy",
      experimentType: "content"
    });

    expect(highRisk.riskLevel).toBe("high");
    expect(mediumRisk.riskLevel).toBe("medium");
    expect(lowRisk.riskLevel).toBe("low");

    expect(highRisk.requiresApproval).toBe(true);
    expect(mediumRisk.requiresApproval).toBe(true);
    expect(lowRisk.requiresApproval).toBe(true);
  });
});
