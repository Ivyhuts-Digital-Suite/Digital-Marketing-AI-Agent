import modelFactory from "./ModelFactory.js";
import { MockModel } from "./MockModel.js";

/**
 * @file Registers all known AIModel providers with the shared ModelFactory.
 *
 * This file is pure side effect — it exports nothing. Import it once at
 * app startup (or at the top of a test file) so the registry is
 * populated before anything calls modelFactory.get(...); importing it
 * more than once is harmless since register() just replaces the entry.
 */

modelFactory.register("mock", new MockModel());
