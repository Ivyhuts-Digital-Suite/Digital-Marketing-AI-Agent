/**
 * @file Registry of AI provider model instances, keyed by provider name.
 * @typedef {import("../types/model.types.js").AIModel} AIModel
 */

/**
 * Holds registered AIModel instances and resolves them by provider name.
 */
export class ModelFactory {
  constructor() {
    /** @type {Map<string, AIModel>} */
    this._models = new Map();
  }

  /**
   * Registers a model instance for a provider. Re-registering replaces the entry.
   * @param {string} providerName - Provider key, e.g. "openai" or "anthropic".
   * @param {AIModel} modelInstance - The model instance to register.
   * @returns {void}
   */
  register(providerName, modelInstance) {
    this._models.set(providerName, modelInstance);
  }

  /**
   * Resolves the model registered for a provider.
   * @param {string} providerName - Provider key, e.g. "openai" or "anthropic".
   * @returns {AIModel} The registered model instance.
   * @throws {Error} If no model is registered for the provider.
   */
  get(providerName) {
    const model = this._models.get(providerName);
    if (!model) {
      throw new Error(
        `No AI model registered for provider "${providerName}"`
      );
    }

    return model;
  }

  /**
   * Returns every registered model instance.
   * @returns {AIModel[]} All registered models, in registration order.
   */
  getAll() {
    return Array.from(this._models.values());
  }
}

/**
 * Shared factory instance for the AI module.
 * @type {ModelFactory}
 */
export default new ModelFactory();
