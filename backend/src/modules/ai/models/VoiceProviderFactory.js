/**
 * @file Registry of VoiceProvider instances, keyed by provider name.
 * @typedef {import("../types/audio.types.js").VoiceProvider} VoiceProvider
 */

/**
 * Holds registered VoiceProvider instances and resolves them by provider name.
 */
export class VoiceProviderFactory {
  constructor() {
    /** @type {Map<string, VoiceProvider>} */
    this._providers = new Map();
  }

  /**
   * Registers a provider instance. Re-registering replaces the entry.
   * @param {string} providerName - Provider key, e.g. "mock" or "elevenlabs".
   * @param {VoiceProvider} providerInstance - The provider instance to register.
   * @returns {void}
   */
  register(providerName, providerInstance) {
    this._providers.set(providerName, providerInstance);
  }

  /**
   * Resolves the provider registered for a provider name.
   * @param {string} providerName - Provider key, e.g. "mock" or "elevenlabs".
   * @returns {VoiceProvider} The registered provider instance.
   * @throws {Error} If no provider is registered for the name.
   */
  get(providerName) {
    const provider = this._providers.get(providerName);
    if (!provider) {
      throw new Error(
        `No voice provider registered for provider "${providerName}"`
      );
    }

    return provider;
  }

  /**
   * Returns every registered provider instance.
   * @returns {VoiceProvider[]} All registered providers, in registration order.
   */
  getAll() {
    return Array.from(this._providers.values());
  }
}

/**
 * Shared factory instance for the AI module.
 * @type {VoiceProviderFactory}
 */
export default new VoiceProviderFactory();
