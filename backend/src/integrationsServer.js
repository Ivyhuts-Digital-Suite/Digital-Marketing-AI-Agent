import "dotenv/config";
import dns from "node:dns";
import { pathToFileURL } from "node:url";
import express from "express";
import mongoose from "mongoose";

import integrationRoutes from "./modules/integrations/routes/integrationRoutes.js";

// This machine's default resolver refuses SRV queries; use public resolvers.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

/**
 * @file Minimal Express app entry point.
 *
 * This is the first Express server in the project — kept deliberately
 * simple (one router mount, JSON body parsing) rather than pulling in
 * conventions (error-handling middleware, logging, etc.) that nothing
 * has asked for yet.
 */

const app = express();

app.use(express.json());

app.use("/api/integrations", integrationRoutes);

const PORT = process.env.PORT || 3001;

// Only connect to MongoDB and start listening when this file is run
// directly, so importing the app (e.g. from a test) doesn't also open a
// real DB connection or start a real server. Compared via pathToFileURL
// rather than a plain `file://${process.argv[1]}` string, since that
// naive form breaks on Windows (backslash paths vs. import.meta.url's
// forward-slash file:// form).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
