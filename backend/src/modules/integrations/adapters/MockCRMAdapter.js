/**
 * @file MOCK IMPLEMENTATION — no real CRM provider API calls are made.
 *
 * This exists to let the rest of the integration layer be built and
 * tested before real CRM provider credentials are available. Replace
 * with a real adapter making actual CRM provider API calls once
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
 * Mock adapter for a CRM provider (leads, contacts, pipeline, and
 * revenue reporting).
 */
export class MockCRMAdapter {
  constructor() {
    /** @type {string} */
    this.name = "crm";
  }

  /**
   * Simulates fetching leads matching the given filters.
   * @param {*} filters
   * @returns {Promise<{ leads: Array<{ leadId: string, name: string, email: string, status: string, source: string }> }>}
   */
  async getLeads(filters) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      leads: [
        {
          leadId: "lead_1",
          name: "Jane Founder",
          email: "jane@example.com",
          status: "new",
          source: "instagram"
        },
        {
          leadId: "lead_2",
          name: "Sam Buyer",
          email: "sam@example.com",
          status: "qualified",
          source: "google_ads"
        }
      ]
    };
  }

  /**
   * Simulates fetching contacts matching the given filters.
   * @param {*} filters
   * @returns {Promise<{ contacts: Array<{ contactId: string, name: string, email: string, company: string }> }>}
   */
  async getContacts(filters) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      contacts: [
        {
          contactId: "contact_1",
          name: "Jane Founder",
          email: "jane@example.com",
          company: "Acme SaaS"
        }
      ]
    };
  }

  /**
   * Simulates fetching the sales pipeline's stage breakdown.
   * @returns {Promise<{ stages: Array<{ stage: string, count: number, value: number }> }>}
   */
  async getPipeline() {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      stages: [
        { stage: "new", count: 12, value: 24000 },
        { stage: "qualified", count: 5, value: 15000 },
        { stage: "won", count: 2, value: 8000 }
      ]
    };
  }

  /**
   * Simulates fetching revenue insights for a period.
   * @param {string} [period]
   * @returns {Promise<{ period: string, totalRevenue: number, dealCount: number, averageDealSize: number }>}
   */
  async getRevenue(period) {
    await wait(SIMULATED_CALL_DELAY_MS);

    return {
      period: period || "this_month",
      totalRevenue: 32000,
      dealCount: 8,
      averageDealSize: 4000
    };
  }
}
