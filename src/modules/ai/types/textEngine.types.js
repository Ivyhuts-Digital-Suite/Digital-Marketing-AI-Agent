/**
 * @file Type definitions for the Instagram text generation engine.
 * JSDoc typedefs only — no runtime logic lives here.
 */

/**
 * A request to generate text content for a piece of Instagram content.
 * @typedef {Object} TextGenerationRequest
 * @property {string} organizationId - Organization the request is scoped to.
 * @property {string} contentItemId - The Content document this generation is for.
 * @property {"instagram"} platform - Target platform.
 * @property {"post"|"carousel"|"reel"|"story"} format - Content format to generate for.
 * @property {string} [creativeBriefId] - The CreativeBrief guiding this generation.
 * @property {*} [brandContext] - Brand voice/identity context (see ContextBuilder).
 * @property {string} [audience] - Target audience description.
 * @property {string} [objective] - What this content is meant to achieve.
 * @property {string} [toneOfVoice] - Tone to write in.
 * @property {string} [constraints] - Brand or format constraints to respect.
 */

/**
 * Generated text for a single-image/single-video Instagram post.
 * @typedef {Object} PostOutput
 * @property {string} hook - The opening line meant to stop the scroll.
 * @property {string} caption - The full post caption.
 * @property {string} cta - The call to action.
 * @property {string[]} hashtags - Hashtags to include.
 */

/**
 * A single slide within a carousel.
 * @typedef {Object} CarouselSlide
 * @property {number} slideNumber - The slide's position in the carousel.
 * @property {string} text - The text content for this slide.
 */

/**
 * Generated text for an Instagram carousel post.
 * @typedef {Object} CarouselOutput
 * @property {CarouselSlide[]} slides - The carousel's slides, in order.
 * @property {string} caption - The full post caption.
 * @property {string[]} hashtags - Hashtags to include.
 */

/**
 * Generated text for an Instagram Reel.
 * @typedef {Object} ReelOutput
 * @property {string} hook - The opening line meant to stop the scroll.
 * @property {string} script - The spoken/narrated script for the reel.
 * @property {string} onScreenText - Text overlay shown on screen.
 * @property {string} cta - The call to action.
 * @property {string} caption - The post caption accompanying the reel.
 */

/**
 * A single frame within an Instagram Story.
 * @typedef {Object} StoryFrame
 * @property {number} frameNumber - The frame's position in the story.
 * @property {string} text - The text content for this frame.
 */

/**
 * Generated text for an Instagram Story.
 * @typedef {Object} StoryOutput
 * @property {StoryFrame[]} frames - The story's frames, in order.
 * @property {string} interaction - An interactive element (poll, question, quiz, etc.).
 * @property {string} cta - The call to action.
 */

export {};
