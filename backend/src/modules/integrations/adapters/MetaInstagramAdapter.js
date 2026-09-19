/**
 * @file MOCK IMPLEMENTATION — no real Meta Graph API calls are made.
 *
 * This exists to let the rest of the integration layer be built and
 * tested before real Meta API credentials are available. Replace with a
 * real adapter making actual Meta Graph API calls once credentials
 * exist. Never represent this mock as a production integration.
 */

const SIMULATED_CALL_DELAY_MS = 200;

/**
 * Resolves after the given delay, to simulate real API latency.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock adapter for the Meta Graph API (Instagram publishing + insights).
 */
export class MetaInstagramAdapter {
  constructor() {
    /** @type {string} */
    this.name = "meta";
  }

  /**
   * Simulates publishing a single-image/single-video post.
   * @param {*} input
   * @returns {Promise<{ success: boolean, externalResourceId: string, publishedAt: Date }>}
   */
  async publishPost(input) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      success: true,
      externalResourceId: `mock_media_${Date.now()}`,
      publishedAt: new Date()
    };
  }

  /**
   * Simulates publishing a carousel post.
   * @param {*} input
   * @returns {Promise<{ success: boolean, externalResourceId: string, publishedAt: Date }>}
   */
  async publishCarousel(input) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      success: true,
      externalResourceId: `mock_media_${Date.now()}`,
      publishedAt: new Date()
    };
  }

  /**
   * Simulates publishing a Reel.
   * @param {*} input
   * @returns {Promise<{ success: boolean, externalResourceId: string, publishedAt: Date }>}
   */
  async publishReel(input) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      success: true,
      externalResourceId: `mock_media_${Date.now()}`,
      publishedAt: new Date()
    };
  }

  /**
   * Simulates fetching an Instagram account's profile.
   * @param {string} accountId
   * @returns {Promise<{ externalAccountId: string, username: string, followersCount: number }>}
   */
  async getProfile(accountId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      externalAccountId: accountId,
      username: "mock_account",
      followersCount: 1000
    };
  }

  /**
   * Simulates fetching engagement metrics for a published piece of content.
   * @param {string} mediaId
   * @returns {Promise<{ mediaId: string, likes: number, comments: number, reach: number, impressions: number }>}
   */
  async getContentMetrics(mediaId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      mediaId,
      likes: 42,
      comments: 5,
      reach: 500,
      impressions: 800
    };
  }
}
