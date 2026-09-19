/**
 * @file MOCK IMPLEMENTATION — no real Google Ads API calls are made.
 *
 * This exists to let the rest of the integration layer be built and
 * tested before real Google Ads credentials are available. Replace with
 * a real adapter making actual Google Ads API calls once credentials
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
 * Mock adapter for the Google Ads API (campaign/keyword/ad insights).
 */
export class MockGoogleAdsAdapter {
  constructor() {
    /** @type {string} */
    this.name = "google_ads";
  }

  /**
   * Simulates fetching a campaign's aggregate performance insights.
   * @param {string} campaignId
   * @returns {Promise<{ campaignId: string, impressions: number, clicks: number, conversions: number, spend: number, ctr: number }>}
   */
  async getCampaignInsights(campaignId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId,
      impressions: 15000,
      clicks: 320,
      conversions: 12,
      spend: 450.5,
      ctr: 2.13
    };
  }

  /**
   * Simulates fetching a campaign's keyword-level performance.
   * @param {string} campaignId
   * @returns {Promise<{ campaignId: string, keywords: Array<{ keyword: string, clicks: number, avgCpc: number }> }>}
   */
  async getKeywordPerformance(campaignId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId,
      keywords: [
        { keyword: "marketing automation", clicks: 45, avgCpc: 1.2 },
        { keyword: "b2b saas", clicks: 30, avgCpc: 1.85 }
      ]
    };
  }

  /**
   * Simulates fetching a single ad's performance.
   * @param {string} adId
   * @returns {Promise<{ adId: string, impressions: number, clicks: number, conversions: number, ctr: number }>}
   */
  async getAdPerformance(adId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      adId,
      impressions: 5000,
      clicks: 110,
      conversions: 4,
      ctr: 2.2
    };
  }

  /**
   * Simulates fetching a campaign's budget insights.
   * @param {string} campaignId
   * @returns {Promise<{ campaignId: string, dailyBudget: number, spentToday: number, remainingBudget: number }>}
   */
  async getBudgetInsights(campaignId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId,
      dailyBudget: 100,
      spentToday: 67.5,
      remainingBudget: 32.5
    };
  }
}
