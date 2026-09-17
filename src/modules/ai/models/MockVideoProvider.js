/**
 * @file Mock implementation of the VideoProvider interface.
 *
 * A working stand-in with no real API calls — useful for exercising the
 * rest of the system before any provider keys are available. A future
 * RunwayVideoProvider.js / similar would implement this exact same
 * shape (name + async generate(request)) once real API calls are wired
 * up.
 * @typedef {import("../types/mediaProvider.types.js").VideoProvider} VideoProvider
 */

/**
 * Resolves after the given delay, to simulate real provider latency.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A mock VideoProvider that returns a fake video URL.
 * @implements {VideoProvider}
 */
export class MockVideoProvider {
  constructor() {
    /** @type {string} */
    this.name = "mock";
  }

  /**
   * Simulates a video generation call.
   * @param {import("../types/mediaProvider.types.js").VideoGenerationRequest} request
   * @returns {Promise<import("../types/mediaProvider.types.js").VideoResult>}
   */
  async generate(request) {
    await wait(100);

    return {
      videoUrl: `https://mock-storage.example.com/video/${Date.now()}.mp4`,
      duration: request.duration || 10
    };
  }
}
