/**
 * @file Builds a concrete DesignSpecification from a VisualConcept and its
 * CreativeBrief.
 *
 * Where VisualConceptGenerator.js decides the creative direction (style,
 * approach, metaphor), this module translates that direction into
 * renderable specifics — dimensions, layout, slide count, required text —
 * that a downstream graphic renderer can act on directly.
 */

const DIMENSIONS_BY_FORMAT = {
  post: { width: 1080, height: 1080 },
  carousel: { width: 1080, height: 1350 },
  reel: { width: 1080, height: 1920 },
  story: { width: 1080, height: 1920 }
};

const DEFAULT_CAROUSEL_SLIDES = 3;

/**
 * Number of slides to spec for a carousel: one per key element, plus a
 * hook slide and a CTA slide — or a default of 3 (hook + points + cta)
 * when no key elements are given.
 * @param {*} creativeBrief
 * @returns {number}
 */
function resolveCarouselSlideCount(creativeBrief) {
  return creativeBrief.keyElements?.length
    ? creativeBrief.keyElements.length + 2
    : DEFAULT_CAROUSEL_SLIDES;
}

/**
 * Builds the DesignSpecification for a piece of content from its
 * VisualConcept and CreativeBrief.
 * @param {import("../types/graphicEngine.types.js").VisualConcept} visualConcept
 * @param {*} creativeBrief - The CreativeBrief data.
 * @returns {import("../types/graphicEngine.types.js").DesignSpecification} The resulting design specification.
 */
export function buildDesignSpecification(visualConcept, creativeBrief) {
  const dimensions = DIMENSIONS_BY_FORMAT[creativeBrief.format];
  if (!dimensions) {
    throw new Error(`Unsupported format: "${creativeBrief.format}"`);
  }

  const isCarousel = creativeBrief.format === "carousel";

  return {
    platform: "instagram",
    dimensions,
    layout: isCarousel ? "multi-slide grid" : "single-frame",
    slides: isCarousel ? resolveCarouselSlideCount(creativeBrief) : 1,
    typography: {
      headingStyle: visualConcept.typography,
      bodyStyle: "Clean sans-serif"
    },
    visualStyle: visualConcept.style,
    composition: visualConcept.visualApproach,
    brandElements: {
      logo: "required",
      colors: "brand primary/secondary",
      fonts: "brand typography"
    },
    requiredText: [creativeBrief.hook, creativeBrief.cta].filter(Boolean),
    visualElements: creativeBrief.keyElements || []
  };
}
