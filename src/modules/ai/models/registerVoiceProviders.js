import voiceProviderFactory from "./VoiceProviderFactory.js";
import { MockVoiceProvider } from "./MockVoiceProvider.js";

/**
 * @file Registers all known VoiceProvider providers with the shared
 * VoiceProviderFactory.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls voiceProviderFactory.get(...);
 * importing it more than once is harmless since register() just
 * replaces the entry.
 */

voiceProviderFactory.register("mock", new MockVoiceProvider());
