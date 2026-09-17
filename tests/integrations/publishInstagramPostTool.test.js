import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import dns from "node:dns";
import mongoose from "mongoose";
import "dotenv/config";

import "../../src/modules/integrations/adapters/registerIntegrationAdapters.js";
import "../../src/modules/integrations/tools/registerIntegrationTools.js";
import toolRegistry from "../../src/modules/ai/tools/ToolRegistry.js";
import Content from "../../models/content.model.js";
import IntegrationAccount from "../../models/integrationAccount.model.js";
import IntegrationExecution from "../../models/integrationExecution.model.js";
import AuditLog from "../../models/auditLog.model.js";

beforeAll(async () => {
  // This machine's default resolver refuses SRV queries; use public resolvers.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("publish_instagram_post tool", () => {
  test("publishes approved content successfully", async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const content = await Content.create({
      organizationId,
      companyId: new mongoose.Types.ObjectId(),
      contentType: "post",
      channel: "instagram",
      status: "approved"
    });
    const account = await IntegrationAccount.create({
      organizationId,
      integrationId: new mongoose.Types.ObjectId(),
      provider: "meta",
      status: "active"
    });

    const tool = toolRegistry.getByName("publish_instagram_post");
    const result = await tool.execute(
      {
        params: {
          contentItemId: content._id,
          integrationAccountId: account._id,
          idempotencyKey: "jest-publish-success"
        }
      },
      { organizationId, runId: "jest-test" }
    );

    expect(result.success).toBe(true);
    expect(result.data.externalResourceId).toBeDefined();

    await Content.deleteOne({ _id: content._id });
    await IntegrationAccount.deleteOne({ _id: account._id });
    await IntegrationExecution.deleteMany({ organizationId });
    await AuditLog.deleteMany({ entityId: content._id });
  });

  test("rejects content that is not approved", async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const content = await Content.create({
      organizationId,
      companyId: new mongoose.Types.ObjectId(),
      contentType: "post",
      channel: "instagram",
      status: "draft"
    });
    // An active account must exist too, so the tool reaches the
    // lifecycle check instead of failing earlier with NOT_CONNECTED.
    const account = await IntegrationAccount.create({
      organizationId,
      integrationId: new mongoose.Types.ObjectId(),
      provider: "meta",
      status: "active"
    });

    const tool = toolRegistry.getByName("publish_instagram_post");
    const result = await tool.execute(
      {
        params: {
          contentItemId: content._id,
          integrationAccountId: account._id,
          idempotencyKey: "jest-publish-not-approved"
        }
      },
      { organizationId, runId: "jest-test" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("INVALID_LIFECYCLE_STATE");

    await Content.deleteOne({ _id: content._id });
    await IntegrationAccount.deleteOne({ _id: account._id });
  });

  test("rejects when no active integration account exists", async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const content = await Content.create({
      organizationId,
      companyId: new mongoose.Types.ObjectId(),
      contentType: "post",
      channel: "instagram",
      status: "approved"
    });

    const tool = toolRegistry.getByName("publish_instagram_post");
    const result = await tool.execute(
      {
        params: {
          contentItemId: content._id,
          integrationAccountId: new mongoose.Types.ObjectId(),
          idempotencyKey: "jest-publish-not-connected"
        }
      },
      { organizationId, runId: "jest-test" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("NOT_CONNECTED");

    await Content.deleteOne({ _id: content._id });
  });

  test("rejects duplicate idempotencyKey", async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const content = await Content.create({
      organizationId,
      companyId: new mongoose.Types.ObjectId(),
      contentType: "post",
      channel: "instagram",
      status: "approved"
    });
    const account = await IntegrationAccount.create({
      organizationId,
      integrationId: new mongoose.Types.ObjectId(),
      provider: "meta",
      status: "active"
    });

    const tool = toolRegistry.getByName("publish_instagram_post");
    const params = {
      contentItemId: content._id,
      integrationAccountId: account._id,
      idempotencyKey: "jest-publish-duplicate"
    };
    const context = { organizationId, runId: "jest-test" };

    const firstResult = await tool.execute({ params }, context);
    const secondResult = await tool.execute({ params }, context);

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toContain("DUPLICATE_OPERATION");

    await Content.deleteOne({ _id: content._id });
    await IntegrationAccount.deleteOne({ _id: account._id });
    await IntegrationExecution.deleteMany({ organizationId });
    await AuditLog.deleteMany({ entityId: content._id });
  });

  test("writes an AuditLog entry on success", async () => {
    const organizationId = new mongoose.Types.ObjectId();
    const content = await Content.create({
      organizationId,
      companyId: new mongoose.Types.ObjectId(),
      contentType: "post",
      channel: "instagram",
      status: "approved"
    });
    const account = await IntegrationAccount.create({
      organizationId,
      integrationId: new mongoose.Types.ObjectId(),
      provider: "meta",
      status: "active"
    });

    const tool = toolRegistry.getByName("publish_instagram_post");
    const result = await tool.execute(
      {
        params: {
          contentItemId: content._id,
          integrationAccountId: account._id,
          idempotencyKey: "jest-publish-audit"
        }
      },
      { organizationId, runId: "jest-test" }
    );

    expect(result.success).toBe(true);

    const auditEntries = await AuditLog.find({
      entityId: content._id,
      action: "publish_instagram_post"
    });

    expect(auditEntries.length).toBeGreaterThanOrEqual(1);

    await Content.deleteOne({ _id: content._id });
    await IntegrationAccount.deleteOne({ _id: account._id });
    await IntegrationExecution.deleteMany({ organizationId });
    await AuditLog.deleteMany({ entityId: content._id });
  });
});
