/**
 * @file Mock implementation of the ImageProvider interface.
 *
 * A working stand-in with no real API calls — useful for exercising the
 * rest of the system before any provider keys are available. A future
 * DalleImageProvider.js / similar would implement this exact same shape
 * (name + async generate(request)) once real API calls are wired up.
 * @typedef {import("../types/mediaProvider.types.js").ImageProvider} ImageProvider
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
 * A mock ImageProvider that returns a fake image URL.
 * @implements {ImageProvider}
 */
export class MockImageProvider {
  constructor() {
    /** @type {string} */
    this.name = "mock";
  }

  /**
   * Simulates an image generation call.
   * @param {import("../types/mediaProvider.types.js").ImageGenerationRequest} request
   * @returns {Promise<import("../types/mediaProvider.types.js").ImageResult>}
   */
  async generate(request) {
    await wait(100);

    return {
      imageUrl: `https://mock-storage.example.com/image/${Date.now()}.png`,
      width: request.dimensions?.width || 1080,
      height: request.dimensions?.height || 1080
    };
  }
}
