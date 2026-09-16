import dotenv from "dotenv";
dotenv.config();

import { HuggingFaceImageProvider } from "../services/contentStudio/providers/huggingFaceImageProvider";
import { HuggingFaceWanVideoProvider } from "../services/contentStudio/providers/huggingFaceWanVideoProvider";
import { MediaProviderError } from "../services/contentStudio/errors";

async function main(): Promise<void> {
  if (!process.env.HUGGINGFACE_API_KEY?.trim()) {
    console.log("Skipped: HUGGINGFACE_API_KEY is not configured.");
    return;
  }
  if (!process.env.HUGGINGFACE_IMAGE_MODEL?.trim()) {
    console.log("Skipped: HUGGINGFACE_IMAGE_MODEL is not configured.");
    return;
  }

  const image = await new HuggingFaceImageProvider().generate({
    format: "instagram_post", subtype: "manual-verification", aspectRatio: "1:1", topic: "Media provider verification", hook: "Verified media", coreMessage: "A minimal B2B abstract image", keyPoints: [], cta: "Learn more",
    visualConcept: { subject: "abstract blue geometric forms", style: "minimal", mood: "professional", composition: "centered", visualElements: [], colorGuidance: "blue", typographyGuidance: "none" }, brandContext: { allowedClaims: [], forbiddenClaims: [] },
  });
  console.log(`Image stored: ${image.url}`);

  const video = await new HuggingFaceWanVideoProvider().generate({
    format: "instagram_reel", subtype: "manual-verification", aspectRatio: "9:16", totalDuration: 4, videoStyle: "motion_graphic", cta: "Learn more", brandContext: { allowedClaims: [], forbiddenClaims: [] },
    scenes: [{ sceneNumber: 1, duration: 4, visualDescription: "Abstract blue geometric forms moving smoothly", animationInstructions: "slow vertical camera motion" }],
  });
  if (video.status !== "completed") throw new Error("Video did not complete.");
  console.log(`Video stored: ${video.result.url}`);
}

main().catch((error: unknown) => {
  if (error instanceof MediaProviderError) console.error(`${error.code}: ${error.message}`);
  else console.error("MEDIA_GENERATION_FAILED");
  process.exitCode = 1;
});
