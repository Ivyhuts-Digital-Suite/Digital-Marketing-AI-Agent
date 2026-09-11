/**
 * @file Mock implementation of the AIModel interface.
 *
 * A working stand-in with no real API calls — useful for exercising the
 * rest of the system before any provider keys are available. A future
 * OpenAIModel.js / AnthropicModel.js would implement this exact same
 * shape (name + async generate(input)) once real API calls are wired up.
 * @typedef {import("../types/model.types.js").AIModel} AIModel
 */

/**
 * Resolves after the given delay, to simulate real model latency.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A mock AIModel that echoes the prompt back with a fake token count.
 * @implements {AIModel}
 */
export class MockModel {
  constructor() {
    /** @type {string} */
    this.name = "mock";
  }

  /**
   * Simulates a generation call.
   * @param {import("../types/model.types.js").AIModelInput} input
   * @returns {Promise<import("../types/model.types.js").AIModelResult>}
   */
  async generate(input) {
    await wait(100);

    // Token counts here are a rough length/4 heuristic, not a real
    // tokenizer — good enough for exercising the plumbing, not for
    // anything resembling accurate usage/cost accounting.
    const inputTokens = Math.ceil(input.prompt.length / 4);
    const outputTokens = 20;

    return {
      text: `Mock response to: "${input.prompt}"`,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      }
    };
  }
}
