/**
 * @file Registry of image and video generation providers, keyed by a
 * combination of media kind and provider name (e.g. "image:mock").
 * @typedef {import("../types/mediaProvider.types.js").ImageProvider} ImageProvider
 * @typedef {import("../types/mediaProvider.types.js").VideoProvider} VideoProvider
 */

/**
 * Builds the internal Map key for a (kind, providerName) pair.
 * @param {string} kind - "image" or "video".
 * @param {string} providerName - Provider key, e.g. "mock".
 * @returns {string}
 */
function toKey(kind, providerName) {
  return `${kind}:${providerName}`;
}

/**
 * Holds registered image/video providers and resolves them by kind and
 * provider name.
 */
export class MediaProviderFactory {
  constructor() {
    /** @type {Map<string, ImageProvider|VideoProvider>} */
    this._providers = new Map();
  }

  /**
   * Registers a provider instance for a media kind. Re-registering the
   * same (kind, providerName) pair replaces the entry.
   * @param {string} kind - "image" or "video".
   * @param {string} providerName - Provider key, e.g. "mock".
   * @param {ImageProvider|VideoProvider} instance - The provider instance to register.
   * @returns {void}
   */
  register(kind, providerName, instance) {
    this._providers.set(toKey(kind, providerName), instance);
  }

  /**
   * Resolves the provider registered for a media kind and provider name.
   * @param {string} kind - "image" or "video".
   * @param {string} providerName - Provider key, e.g. "mock".
   * @returns {ImageProvider|VideoProvider} The registered provider instance.
   * @throws {Error} If no provider is registered for that kind/name.
   */
  get(kind, providerName) {
    const key = toKey(kind, providerName);
    const provider = this._providers.get(key);
    if (!provider) {
      throw new Error(
        `No ${kind} provider registered for provider "${providerName}"`
      );
    }

    return provider;
  }

  /**
   * Returns every registered provider instance, across all kinds.
   * @returns {Array<ImageProvider|VideoProvider>} All registered providers, in registration order.
   */
  getAll() {
    return Array.from(this._providers.values());
  }
}

/**
 * Shared factory instance for the AI module.
 * @type {MediaProviderFactory}
 */
export default new MediaProviderFactory();
