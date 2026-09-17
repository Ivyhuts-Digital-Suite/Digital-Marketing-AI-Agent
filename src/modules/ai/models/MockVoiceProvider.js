/**
 * @file Mock implementation of the VoiceProvider interface.
 *
 * A working stand-in with no real API calls — useful for exercising the
 * rest of the system before any provider keys are available. A future
 * ElevenLabsVoiceProvider.js / similar would implement this exact same
 * shape (name + async generateVoice(input)) once real API calls are
 * wired up.
 * @typedef {import("../types/audio.types.js").VoiceProvider} VoiceProvider
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
 * A mock VoiceProvider that returns a fake audio URL.
 * @implements {VoiceProvider}
 */
export class MockVoiceProvider {
  constructor() {
    /** @type {string} */
    this.name = "mock";
  }

  /**
   * Simulates a voiceover generation call.
   * @param {import("../types/audio.types.js").VoiceRequest} input
   * @returns {Promise<import("../types/audio.types.js").VoiceAsset>}
   */
  async generateVoice(input) {
    await wait(100);

    return {
      audioUrl: `https://mock-storage.example.com/audio/${Date.now()}.mp3`,
      duration: input.duration || 10,
      format: "mp3"
    };
  }
}
