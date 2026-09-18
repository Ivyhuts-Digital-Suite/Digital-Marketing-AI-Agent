const mongoose = require("mongoose");
require("dotenv").config();

describe("ExperimentEngine", () => {
  let createHypothesis, createExperiment, evaluateExperiment;
  let Hypothesis, Experiment, ExperimentVariant, ExperimentResult;
  let organizationId;

  beforeAll(async () => {
    require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(process.env.MONGODB_URI);

    ({ createHypothesis, createExperiment, evaluateExperiment } = await import(
      "../../src/modules/experimentation/ExperimentEngine.js"
    ));

    ({ default: Hypothesis } = await import("../../src/models/hypothesis.model.js"));
    ({ default: Experiment } = await import("../../src/models/experiment.model.js"));
    ({ default: ExperimentVariant } = await import(
      "../../src/models/experimentVariant.model.js"
    ));
    ({ default: ExperimentResult } = await import(
      "../../src/models/experimentResult.model.js"
    ));

    organizationId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("creates a hypothesis with proposed status", async () => {
    const hypothesis = await createHypothesis({
      organizationId,
      statement: "Video posts on Instagram get higher engagement than image posts",
      category: "content",
      independentVariable: "post_format",
      dependentMetric: "engagement_rate",
      targetAudience: "existing_followers",
      channel: "instagram",
      contentType: "video",
      expectedDirection: "increase",
      rationale: "Recent platform data suggests video is favored by the algorithm",
      createdBy: "human",
      confidence: "medium"
    });

    expect(hypothesis.status).toBe("proposed");
  });

  test("designs an experiment linked to its hypothesis", async () => {
    const hypothesis = await createHypothesis({
      organizationId,
      statement: "Shorter captions outperform longer captions on click-through rate",
      independentVariable: "caption_length",
      dependentMetric: "click_through_rate",
      channel: "instagram",
      contentType: "image",
      expectedDirection: "increase"
    });

    const experiment = await createExperiment({
      hypothesisId: hypothesis._id,
      controlValue: "long_caption",
      variantValue: "short_caption"
    });

    expect(experiment.hypothesisId.toString()).toBe(hypothesis._id.toString());
    expect(experiment.status).toBe("designed");
  });

  test("evaluates a VARIANT_SUPPORTED result and persists ExperimentResult + Learning", async () => {
    const hypothesis = await createHypothesis({
      organizationId,
      statement: "A stronger CTA increases conversion rate",
      independentVariable: "cta_copy",
      dependentMetric: "conversion_rate",
      targetAudience: "existing_followers",
      channel: "instagram",
      contentType: "image",
      expectedDirection: "increase"
    });

    const experiment = await createExperiment({
      hypothesisId: hypothesis._id,
      controlValue: "Learn More",
      variantValue: "Shop Now"
    });

    await ExperimentVariant.create({
      organizationId,
      experimentId: experiment._id,
      type: "control",
      name: "Control",
      configuration: "Learn More"
    });

    await ExperimentVariant.create({
      organizationId,
      experimentId: experiment._id,
      type: "variant",
      name: "Variant",
      configuration: "Shop Now"
    });

    const result = await evaluateExperiment({
      experimentId: experiment._id,
      controlConversions: 380,
      controlSampleSize: 10000,
      variantConversions: 470,
      variantSampleSize: 10000
    });

    expect(result.success).toBe(true);
    expect(result.resultState).toBe("VARIANT_SUPPORTED");
    expect(result.learning).toBeTruthy();
    expect(typeof result.learning.statement).toBe("string");
    expect(result.learning.statement.length).toBeGreaterThan(0);

    const persistedResults = await ExperimentResult.find({ experimentId: experiment._id });
    expect(persistedResults).toHaveLength(2);
  });

  test("rejects evaluation with no ExperimentVariants", async () => {
    const hypothesis = await createHypothesis({
      organizationId,
      statement: "Posting time affects reach",
      independentVariable: "posting_time",
      dependentMetric: "reach",
      channel: "instagram",
      contentType: "image",
      expectedDirection: "increase"
    });

    const experiment = await createExperiment({
      hypothesisId: hypothesis._id,
      controlValue: "morning",
      variantValue: "evening"
    });

    const result = await evaluateExperiment({
      experimentId: experiment._id,
      controlConversions: 100,
      controlSampleSize: 1000,
      variantConversions: 120,
      variantSampleSize: 1000
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("MISSING_EXPERIMENT_VARIANTS");
  });
});
