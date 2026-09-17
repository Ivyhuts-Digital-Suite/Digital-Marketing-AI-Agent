/**
 * @file Rule-based brand/content validation for generated text output.
 *
 * This is an MVP placeholder, in the same spirit as ./VisualConceptGenerator.js
 * and ./SceneAssetSelector.js: it runs a small set of fixed structural
 * checks (is a CTA present, is a hook present, does the CTA match the
 * brief) rather than anything resembling real brand-voice or quality
 * review. Per the roadmap, a future version should let an AI model (or
 * a human approval step) do genuine brand/quality validation.
 */

/**
 * Extracts the "effective" CTA from a text output, accounting for
 * formats (like carousel) that don't carry a top-level `cta` field —
 * for those, the last slide is treated as the CTA slide.
 * @param {*} textOutput
 * @returns {string|undefined}
 */
function extractCta(textOutput) {
  if (textOutput.cta) {
    return textOutput.cta;
  }

  if (textOutput.slides?.length) {
    return textOutput.slides[textOutput.slides.length - 1].text;
  }

  return undefined;
}

/**
 * Checks that a CTA is present somewhere reasonable for the format.
 * @param {*} textOutput
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkHasCta(textOutput) {
  const cta = extractCta(textOutput);
  const passed = Boolean(cta && cta.trim());

  return {
    name: "has_cta",
    passed,
    message: passed
      ? "A call-to-action is present."
      : "No call-to-action was found in the content."
  };
}

/**
 * Checks that a hook is present, for formats that have a hook field.
 * Formats without a top-level `hook` (e.g. carousel, story) skip this
 * check rather than fail it.
 * @param {*} textOutput
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkHookPresent(textOutput) {
  if (!("hook" in textOutput)) {
    return {
      name: "hook_present",
      passed: true,
      message: "Format has no dedicated hook field; check skipped."
    };
  }

  const passed = Boolean(textOutput.hook && textOutput.hook.trim());

  return {
    name: "hook_present",
    passed,
    message: passed
      ? "A hook is present."
      : "No hook was found to open the content."
  };
}

/**
 * Checks that the content's CTA matches the brief's intended CTA. Skips
 * (rather than fails) when there's no content CTA to compare — that
 * case is already covered by checkHasCta.
 * @param {*} textOutput
 * @param {*} creativeBrief
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkMatchesBriefCta(textOutput, creativeBrief) {
  const cta = extractCta(textOutput);

  if (!cta) {
    return {
      name: "matches_brief_cta",
      passed: true,
      message: "No content CTA to compare; check skipped."
    };
  }

  const passed = cta === creativeBrief.cta;

  return {
    name: "matches_brief_cta",
    passed,
    message: passed
      ? "The CTA matches the creative brief."
      : `The CTA "${cta}" does not match the brief's CTA "${creativeBrief.cta}".`
  };
}

/**
 * Checks that the assembled video has at least one scene.
 * @param {*} finalVideo
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkHasScenes(finalVideo) {
  const passed = finalVideo.sceneCount > 0;

  return {
    name: "has_scenes",
    passed,
    message: passed
      ? "The video has at least one scene."
      : "The video has no scenes."
  };
}

/**
 * Checks that the video's duration is reasonable for the platform (up
 * to 90 seconds).
 * @param {*} finalVideo
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkDurationReasonable(finalVideo) {
  const passed = finalVideo.duration > 0 && finalVideo.duration <= 90;

  return {
    name: "duration_reasonable",
    passed,
    message: passed
      ? `Duration of ${finalVideo.duration}s is within a reasonable range.`
      : `Duration of ${finalVideo.duration}s is outside the reasonable range (0-90s).`
  };
}

/**
 * Checks that the assembled video includes branded elements.
 * @param {*} finalVideo
 * @returns {import("../types/brandValidation.types.js").ValidationCheck}
 */
function checkBrandElementsPresent(finalVideo) {
  const passed = finalVideo.hasBrandElements === true;

  return {
    name: "brand_elements_present",
    passed,
    message: passed
      ? "Branded elements are present in the video."
      : "The video has no branded elements."
  };
}

/**
 * Builds a human-readable revision instruction for a failed check.
 * @param {import("../types/brandValidation.types.js").ValidationCheck} check
 * @returns {string}
 */
function toRevisionInstruction(check) {
  return `Fix "${check.name}": ${check.message}`;
}

/**
 * Validates generated text content against its creative brief using a
 * small set of fixed structural rules.
 * @param {*} textOutput - The generated text output (PostOutput/CarouselOutput/ReelOutput/StoryOutput).
 * @param {*} creativeBrief - The CreativeBrief the content was generated from.
 * @returns {import("../types/brandValidation.types.js").BrandValidationResult} The validation result.
 */
export function validateTextContent(textOutput, creativeBrief) {
  const checks = [
    checkHasCta(textOutput),
    checkHookPresent(textOutput),
    checkMatchesBriefCta(textOutput, creativeBrief)
  ];

  const approved = checks.every((check) => check.passed);

  const revisionInstructions = checks
    .filter((check) => !check.passed)
    .map(toRevisionInstruction);

  return { approved, checks, revisionInstructions };
}

/**
 * Validates an assembled video against its creative brief using a small
 * set of fixed structural rules.
 * @param {*} finalVideo - The assembled video (FinalVideo).
 * @param {*} creativeBrief - The CreativeBrief the video was generated from.
 * @returns {import("../types/brandValidation.types.js").BrandValidationResult} The validation result.
 */
export function validateVideoContent(finalVideo, creativeBrief) {
  const checks = [
    checkHasScenes(finalVideo),
    checkDurationReasonable(finalVideo),
    checkBrandElementsPresent(finalVideo)
  ];

  const approved = checks.every((check) => check.passed);

  const revisionInstructions = checks
    .filter((check) => !check.passed)
    .map(toRevisionInstruction);

  return { approved, checks, revisionInstructions };
}
