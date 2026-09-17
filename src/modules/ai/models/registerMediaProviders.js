import mediaProviderFactory from "./MediaProviderFactory.js";
import { MockImageProvider } from "./MockImageProvider.js";
import { MockVideoProvider } from "./MockVideoProvider.js";

/**
 * @file Registers all known image/video providers with the shared
 * MediaProviderFactory.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls mediaProviderFactory.get(...);
 * importing it more than once is harmless since register() just
 * replaces the entry.
 */

mediaProviderFactory.register("image", "mock", new MockImageProvider());
mediaProviderFactory.register("video", "mock", new MockVideoProvider());
