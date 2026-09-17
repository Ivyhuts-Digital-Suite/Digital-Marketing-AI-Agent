/**
 * @file MOCK IMPLEMENTATION — no real email provider API calls are made.
 *
 * This exists to let the rest of the integration layer be built and
 * tested before real email provider credentials are available. Replace
 * with a real adapter making actual email provider API calls once
 * credentials exist. Never represent this mock as a production
 * integration.
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
 * Mock adapter for an email marketing provider (campaign creation,
 * audience segmentation, and performance metrics).
 */
export class MockEmailAdapter {
  constructor() {
    /** @type {string} */
    this.name = "email";
  }

  /**
   * Simulates creating an email campaign.
   * @param {*} input
   * @returns {Promise<{ campaignId: string, status: string, createdAt: Date }>}
   */
  async createCampaign(input) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId: `mock_campaign_${Date.now()}`,
      status: "draft",
      createdAt: new Date()
    };
  }

  /**
   * Simulates segmenting an audience.
   * @param {*} input
   * @returns {Promise<{ segmentId: string, estimatedSize: number }>}
   */
  async segmentAudience(input) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      segmentId: `mock_segment_${Date.now()}`,
      estimatedSize: 1250
    };
  }

  /**
   * Simulates fetching a campaign's raw engagement metrics.
   * @param {string} campaignId
   * @returns {Promise<{ campaignId: string, sent: number, delivered: number, opened: number, clicked: number, bounced: number, unsubscribed: number }>}
   */
  async getCampaignMetrics(campaignId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId,
      sent: 1250,
      delivered: 1220,
      opened: 480,
      clicked: 95,
      bounced: 30,
      unsubscribed: 5
    };
  }

  /**
   * Simulates fetching a campaign's computed performance rates.
   * @param {string} campaignId
   * @returns {Promise<{ campaignId: string, openRate: number, clickRate: number, bounceRate: number }>}
   */
  async getPerformance(campaignId) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      campaignId,
      openRate: 39.3,
      clickRate: 7.8,
      bounceRate: 2.4
    };
  }
}
