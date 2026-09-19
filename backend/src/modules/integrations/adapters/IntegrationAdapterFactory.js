/**
 * @file Registry of integration adapter instances, keyed by provider name.
 */

/**
 * Holds registered integration adapters and resolves them by provider name.
 */
export class IntegrationAdapterFactory {
  constructor() {
    /** @type {Map<string, *>} */
    this._adapters = new Map();
  }

  /**
   * Registers an adapter instance for a provider. Re-registering replaces
   * the entry.
   * @param {string} providerName - Provider key, e.g. "meta".
   * @param {*} adapterInstance - The adapter instance to register.
   * @returns {void}
   */
  register(providerName, adapterInstance) {
    this._adapters.set(providerName, adapterInstance);
  }

  /**
   * Resolves the adapter registered for a provider.
   * @param {string} providerName - Provider key, e.g. "meta".
   * @returns {*} The registered adapter instance.
   * @throws {Error} If no adapter is registered for the provider.
   */
  get(providerName) {
    const adapter = this._adapters.get(providerName);
    if (!adapter) {
      throw new Error(
        `No integration adapter registered for provider "${providerName}"`
      );
    }

    return adapter;
  }

  /**
   * Returns every registered adapter instance.
   * @returns {*[]} All registered adapters, in registration order.
   */
  getAll() {
    return Array.from(this._adapters.values());
  }
}

/**
 * Shared factory instance for the integrations module.
 * @type {IntegrationAdapterFactory}
 */
export default new IntegrationAdapterFactory();
