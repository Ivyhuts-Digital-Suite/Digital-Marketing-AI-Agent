import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import Organization from "../models/Organization";
import OrganizationMembership from "../models/OrganizationMembership";
import User from "../models/User";
import KnowledgeSource from "../models/KnowledgeSource";
import KnowledgeChunk from "../models/KnowledgeChunk";
import CompanyIntelligence from "../models/CompanyIntelligence";
import BrandProfile from "../models/BrandProfile";
import { chunkingService } from "../services/chunking/chunkingService";
import { embeddingService } from "../services/embedding/embeddingService";
import { EmbeddingConfigurationError } from "../services/embedding/errors";

/**
 * Development-only knowledge seed for IVYHUTS - NOT run automatically.
 *
 *   npm run seed:ivyhuts
 *
 * Seeds ONLY KnowledgeSource + KnowledgeChunk (via the real chunkingService,
 * not hand-rolled chunk-splitting) so the existing Company Intelligence
 * pipeline has something real to read. Deliberately does NOT call
 * CompanyIntelligenceService itself - that's a separate, LLM-costing,
 * upsert-with-versioning operation the caller should trigger explicitly
 * (POST /api/company-intelligence/generate) once this knowledge exists,
 * not something a re-runnable seed script should fire on every run.
 *
 * Why 7 KnowledgeSources instead of 1: companyIntelligenceContext.ts (the
 * real, unmodified context-gathering step this seed must work WITH, not
 * around) caps context at 5 chunks / ~1500 chars PER SOURCE - a sampling
 * limit designed for "many uploaded documents", not "one document with 16
 * topics". A single source would silently lose 11 of the 16 topics to that
 * cap. Splitting the same 16 topics across 7 thematically-grouped sources
 * (each comfortably under the per-source cap) lets every topic actually
 * reach Company Intelligence generation, without touching that shared
 * context-gathering logic at all.
 *
 * Safety: every document this script creates/updates is tagged with
 * SEED_TAG (+ a per-group SEED_GROUP_FIELD) in its metadata, and every
 * lookup/mutation is scoped to those tags - it can never see or touch a
 * real (non-tagged) KnowledgeSource for this organization, so pre-existing
 * real data is structurally impossible for this script to overwrite.
 */

const DEFAULT_ORGANIZATION_ID = "6aa67134793eb38b890eee05";
const SEED_TAG = "ivyhuts-dev-seed-v2";
const LEGACY_SEED_TAGS = ["ivyhuts-dev-seed-v1"];

interface SeedSection {
  heading: string;
  text: string;
}

interface SeedSourceGroup {
  key: string;
  filename: string;
  sections: SeedSection[];
}

const SOURCE_GROUPS: SeedSourceGroup[] = [
  {
    key: "company-profile",
    filename: "IVYHUTS - Company Overview & Problem (Seed Data)",
    sections: [
      {
        heading: "Company Overview",
        text:
          "[DEVELOPMENT SEED DATA - not verified external research] IVYHUTS is a student accommodation discovery " +
          "platform focused on helping students find suitable housing near universities and educational " +
          "institutions. The platform is designed as a global accommodation-discovery experience. Users can " +
          "search for accommodation using university names, educational institution names, location searches, " +
          "and supported Google Maps URLs. The system is designed to resolve location information and help users " +
          "discover relevant accommodation options. The platform focuses on making the process of finding student " +
          "housing easier and more location-aware.",
      },
      {
        heading: "Core Problem",
        text:
          "Students often face difficulty when searching for accommodation near a university. Common challenges " +
          "include: not knowing which areas are close to their university; searching across multiple websites; " +
          "difficulty discovering relevant accommodation options; location information being fragmented; " +
          "international students being unfamiliar with local areas; and difficulty understanding proximity " +
          "between accommodation and educational institutions. IVYHUTS aims to simplify accommodation discovery " +
          "by connecting university/location information with accommodation search.",
      },
    ],
  },
  {
    key: "users-and-capabilities",
    filename: "IVYHUTS - Target Users & Platform Capabilities (Seed Data)",
    sections: [
      {
        heading: "Target Users",
        text:
          "Primary audiences include: Students searching for accommodation near universities, colleges, and " +
          "educational institutions. International Students moving to a new city, region, or country who may " +
          "have limited local knowledge. University Students Relocating - students moving away from their " +
          "hometown to attend an educational institution. Potential future ecosystem audiences may include " +
          "accommodation providers, student housing operators, and property managers - these are potential " +
          "future audiences only, not confirmed current users of the platform.",
      },
      {
        heading: "Core Platform Capabilities",
        text:
          "IVYHUTS supports a location-driven accommodation discovery experience. The platform's core " +
          "capabilities are: University/Institution Search, Location Resolution, Google Maps URL Support, and " +
          "Accommodation Discovery. Together these let a user go from naming a university or pasting a location " +
          "link to seeing accommodation options relevant to that location.",
      },
    ],
  },
  {
    key: "product-features",
    filename: "IVYHUTS - Search & Location Product Features (Seed Data)",
    sections: [
      {
        heading: "University Search",
        text:
          "Users can search for universities and educational institutions directly. This search is the primary " +
          "entry point for the accommodation discovery experience - a student names their university or " +
          "institution and the platform uses that as the geographic anchor for accommodation discovery.",
      },
      {
        heading: "Location Resolution",
        text:
          "Different location inputs converge into a unified resolved-location pipeline. The resolved location " +
          "may include a validated name, latitude, longitude, city, country, address, location type, and source. " +
          "This resolution step is what allows university names, institution names, plain location searches, and " +
          "Google Maps URLs to all feed into the same downstream accommodation discovery logic.",
      },
      {
        heading: "Google Maps URL Support",
        text:
          "The platform is designed to support location input from supported Google Maps URLs, including formats " +
          "such as google.com/maps, maps.app.goo.gl, goo.gl/maps, and other supported Google Maps share links. " +
          "The goal is to convert different location inputs into useful geographic context for accommodation " +
          "discovery.",
      },
      {
        heading: "Accommodation Discovery",
        text:
          "Once a relevant university or location is resolved, the system helps users discover accommodation " +
          "options relevant to that location. Accommodation discovery is the outcome the entire search and " +
          "location-resolution pipeline is built to support.",
      },
    ],
  },
  {
    key: "positioning-and-value",
    filename: "IVYHUTS - Positioning & Value Proposition (Seed Data)",
    sections: [
      {
        heading: "Product Positioning",
        text:
          "IVYHUTS should be positioned as a smart, location-aware student accommodation discovery platform. Key " +
          "positioning themes: student-focused, location-aware, university-centered, global discovery, " +
          "simplifying accommodation search, and helping students discover housing near where they study. " +
          "Potential differentiators, framed carefully and without claiming superiority over any named " +
          "competitor: university-centered accommodation discovery, a location-aware search experience, the " +
          "ability to work with different types of location inputs (university names, institution names, plain " +
          "search, and Google Maps URLs), and a global accommodation-discovery direction with a student-focused " +
          "user experience. IVYHUTS should NOT be positioned as a guaranteed accommodation provider, a university " +
          "itself, or a real estate agency unless explicitly supported by verified product information.",
      },
      {
        heading: "Value Proposition",
        text:
          "IVYHUTS helps students make accommodation discovery easier by connecting where they study with where " +
          "they can live. Core value themes: discover accommodation near educational institutions; reduce " +
          "friction in location-based accommodation searching; help students explore unfamiliar cities; support " +
          "location-aware housing discovery; and make university-related accommodation searches simpler.",
      },
    ],
  },
  {
    key: "brand",
    filename: "IVYHUTS - Brand Personality & Voice (Seed Data)",
    sections: [
      {
        heading: "Brand Personality",
        text:
          "The IVYHUTS brand should feel helpful, modern, student-friendly, trustworthy, global, clear, " +
          "supportive, and technology-enabled. Communication should avoid overly corporate language, complex " +
          "real-estate jargon, unsupported promises, and fear-based messaging.",
      },
      {
        heading: "Brand Voice",
        text:
          "Recommended communication style: clear, friendly, helpful, informative, modern, and confident but not " +
          "exaggerated. The brand should speak like a helpful platform helping students navigate a major life " +
          "transition.",
      },
    ],
  },
  {
    key: "content-and-allowed-claims",
    filename: "IVYHUTS - Content Pillars & Allowed Claims (Seed Data)",
    sections: [
      {
        heading: "Content Pillars",
        text:
          "Potential content pillars for IVYHUTS: (1) Student Accommodation Tips - e.g. how to find accommodation " +
          "near your university, things to check before choosing student housing, questions to ask before moving " +
          "in. (2) University & City Discovery - e.g. exploring student life in different cities, accommodation " +
          "considerations around universities, moving to a new city as a student. (3) International Student " +
          "Guidance - e.g. preparing to move abroad, understanding a new city, finding accommodation in " +
          "unfamiliar locations. (4) Smart Accommodation Discovery - e.g. using location to search smarter, why " +
          "proximity matters, understanding your university neighborhood. (5) Student Lifestyle - e.g. settling " +
          "into a new city, student living tips, making a new place feel like home. (6) IVYHUTS Product Education " +
          "- e.g. how IVYHUTS works, searching using a university, using location information to discover " +
          "accommodation.",
      },
      {
        heading: "Allowed Marketing Claims",
        text:
          "Allowed claims should include only reasonable statements such as: helps students discover " +
          "accommodation options; designed for university-related accommodation discovery; supports " +
          "location-aware accommodation searching; helps students explore housing near educational institutions; " +
          "designed to simplify accommodation discovery.",
      },
    ],
  },
  {
    key: "forbidden-claims-and-dev-goals",
    filename: "IVYHUTS - Forbidden Claims & Dev Marketing Goals (Seed Data)",
    sections: [
      {
        heading: "Forbidden Claims and Unsupported Promises",
        text:
          "Do NOT generate or use unsupported claims such as: guaranteed cheapest accommodation; guaranteed " +
          "accommodation availability; guaranteed best housing; guaranteed university-approved housing; " +
          "guaranteed safety; guaranteed prices; or claiming to be the number-one student housing platform. These " +
          "claims are not supported by verified product information and must never be used in generated " +
          "marketing content.",
      },
      {
        heading: "Development Marketing Goals (illustrative only, not verified company facts)",
        text:
          "[DEVELOPMENT/TESTING CONTEXT ONLY - these are illustrative marketing objectives assumed for local " +
          "development and testing, not verified business facts or commitments] For development/testing " +
          "purposes, assume the marketing objectives include: increasing brand awareness; educating students " +
          "about smarter accommodation discovery; building an Instagram presence; reaching students preparing to " +
          "relocate; reaching international students; and driving users toward exploring the IVYHUTS platform.",
      },
    ],
  },
];

function guardEnvironment(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitlyAllowed = process.env.SEED_ALLOW_PRODUCTION === "true";

  if (isProduction && !explicitlyAllowed) {
    console.error(
      "Refusing to run the IVYHUTS knowledge seed: NODE_ENV=production. This seed creates clearly-labeled " +
        "development/mock company knowledge - it must never run against a real production database. Set " +
        "SEED_ALLOW_PRODUCTION=true only if you are certain this is not a real production environment."
    );
    process.exit(1);
  }
}

async function removeLegacySeedSources(organizationId: string): Promise<void> {
  const legacySources = await KnowledgeSource.find({
    organizationId,
    "metadata.seedTag": { $in: LEGACY_SEED_TAGS },
  });

  for (const legacySource of legacySources) {
    await KnowledgeChunk.deleteMany({ organizationId, sourceId: legacySource._id });
    await KnowledgeSource.deleteOne({ _id: legacySource._id });
    console.log(`  removed superseded seed source from an earlier seed version (${legacySource._id})`);
  }
}

async function main() {
  guardEnvironment();
  await connectDB();

  const organizationId = process.env.IVYHUTS_ORGANIZATION_ID || DEFAULT_ORGANIZATION_ID;

  console.log(`Seeding IVYHUTS development knowledge for organization ${organizationId}...`);

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    console.error(`Organization "${organizationId}" does not exist. Aborting - nothing was written.`);
    process.exit(1);
  }
  console.log(`  organization found: ${organization.name}`);

  // Data integrity check: report what already exists, but never act on
  // anything outside this script's own tagged sources.
  const existingRealSources = await KnowledgeSource.countDocuments({
    organizationId,
    "metadata.seedTag": { $nin: [SEED_TAG, ...LEGACY_SEED_TAGS] },
  });
  if (existingRealSources > 0) {
    console.log(
      `  note: this organization already has ${existingRealSources} other KnowledgeSource(s) not created by this ` +
        "script - they are left untouched; this seed only ever manages its own tagged sources."
    );
  }

  const existingCompanyIntelligence = await CompanyIntelligence.findOne({ organizationId });
  const existingBrandProfile = await BrandProfile.findOne({ organizationId });
  if (existingCompanyIntelligence || existingBrandProfile) {
    console.log(
      "  note: CompanyIntelligence and/or BrandProfile already exist for this organization. This script does not " +
        "touch them - it only seeds knowledge. Company Intelligence generation (a separate step) will upsert them " +
        "if you run it."
    );
  }

  await removeLegacySeedSources(organizationId);

  const ownerMembership = await OrganizationMembership.findOne({ organizationId, role: "owner" }).lean();
  const uploadedBy = ownerMembership?.userId ?? (await User.findOne().lean())?._id;
  if (!uploadedBy) {
    console.error("No user exists to attribute these KnowledgeSources to (uploadedBy is required). Aborting.");
    process.exit(1);
  }

  let totalChunks = 0;

  for (const group of SOURCE_GROUPS) {
    let source = await KnowledgeSource.findOne({
      organizationId,
      "metadata.seedTag": SEED_TAG,
      "metadata.seedGroup": group.key,
    });

    if (!source) {
      source = await KnowledgeSource.create({
        organizationId,
        uploadedBy,
        filename: group.filename,
        type: "other",
        status: "uploaded",
        metadata: {
          seedTag: SEED_TAG,
          seedGroup: group.key,
          isDevSeed: true,
          seedLabel: "IVYHUTS development seed data - not verified external research",
        },
      });
      console.log(`  created KnowledgeSource "${group.filename}" (${source._id})`);
    } else {
      console.log(`  KnowledgeSource "${group.filename}" already exists (${source._id}) - re-chunking to refresh content`);
    }

    const fullText = group.sections.map((section) => `${section.heading}\n\n${section.text}`).join("\n\n");

    const chunkResult = await chunkingService.chunkAndPersist({
      organizationId,
      sourceId: source._id.toString(),
      processedDocument: {
        format: "txt",
        filename: group.filename,
        text: fullText,
        sections: group.sections.map((section) => ({ heading: section.heading, text: section.text })),
        metadata: { seedTag: SEED_TAG, seedGroup: group.key },
      },
    });
    totalChunks += chunkResult.chunkCount;
    console.log(`    -> ${chunkResult.chunkCount} chunks (source status -> "chunked")`);

    const apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
    if (apiKeyConfigured) {
      try {
        const embedResult = await embeddingService.embedChunksForSource(organizationId, source._id.toString());
        console.log(`    -> generated real embeddings for ${embedResult.chunkCount} chunks (source status -> "embedded")`);
      } catch (error) {
        if (error instanceof EmbeddingConfigurationError) {
          console.log("    -> OPENAI_API_KEY looked set but embedding client rejected it - skipping embeddings.");
        } else {
          console.log(
            `    -> embedding generation failed (${error instanceof Error ? error.message : String(error)}) - skipping.`
          );
        }
      }
    }
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim().length === 0) {
    console.log(
      '\n  OPENAI_API_KEY not configured - embeddings skipped for all sources. Not required: Company ' +
        'Intelligence context gathering reads chunk text directly ("chunked" status is already usable), it does ' +
        "not perform a vector search."
    );
  }

  console.log(`\nTotal: ${SOURCE_GROUPS.length} KnowledgeSources, ${totalChunks} KnowledgeChunks.`);

  console.log("\nNext step - trigger Company Intelligence generation:");
  console.log("  POST /api/company-intelligence/generate");
  console.log("  Authorization: Bearer <your JWT>");
  console.log(`  Body: { "organizationId": "${organizationId}" }`);
  console.log("  (requires GEMINI_API_KEY to be configured on the backend)");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("IVYHUTS knowledge seed failed:", error);
  process.exit(1);
});
