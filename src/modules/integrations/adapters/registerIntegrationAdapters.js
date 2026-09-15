import integrationAdapterFactory from "./IntegrationAdapterFactory.js";
import { MetaInstagramAdapter } from "./MetaInstagramAdapter.js";
import { MockGoogleAdsAdapter } from "./MockGoogleAdsAdapter.js";
import { MockEmailAdapter } from "./MockEmailAdapter.js";

/**
 * @file Registers all known integration adapters with the shared
 * IntegrationAdapterFactory.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls integrationAdapterFactory.get(...);
 * importing it more than once is harmless since register() just
 * replaces the entry.
 */

integrationAdapterFactory.register("meta", new MetaInstagramAdapter());
integrationAdapterFactory.register("google_ads", new MockGoogleAdsAdapter());
integrationAdapterFactory.register("email", new MockEmailAdapter());
