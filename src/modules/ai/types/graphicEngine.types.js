/**
 * @file Type definitions for the Instagram graphic/visual generation engine.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * The high-level creative direction for a piece of visual content, ahead
 * of a concrete design spec.
 * @typedef {Object} VisualConcept
 * @property {string} style - Overall visual style (e.g. "minimal", "bold").
 * @property {string} format - Content format this concept is for.
 * @property {string} visualApproach - How the concept will be visually executed.
 * @property {string} typography - Typographic direction for the concept.
 * @property {string} brandIntegration - How brand identity shows up in the visual.
 * @property {string} visualMetaphor - The central visual metaphor or motif.
 */

/**
 * A concrete, renderable design specification for a piece of Instagram
 * visual content.
 * @typedef {Object} DesignSpecification
 * @property {"instagram"} platform - Target platform.
 * @property {{ width: number, height: number }} dimensions - Canvas dimensions in pixels.
 * @property {string} layout - The layout arrangement to use.
 * @property {number} slides - Number of slides (1 for single-image formats).
 * @property {{ headingStyle: string, bodyStyle: string }} typography - Typography treatment.
 * @property {string} visualStyle - Overall visual style direction.
 * @property {string} composition - Compositional guidance.
 * @property {{ logo: string, colors: string, fonts: string }} brandElements - Brand assets/guidance to apply.
 * @property {string[]} requiredText - Text strings that must appear on the design.
 * @property {string[]} visualElements - Visual elements/assets to include.
 */

export {};
