import { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from "./imageProvider.interface";

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current.length > 0) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Development/mock image provider - deterministically renders a labeled
 * placeholder SVG (as a data: URI, so it needs no network access or API
 * key) instead of calling a real image generation model.
 *
 * This is NOT a production image generator. Every result is marked
 * `isMock: true` so nothing downstream (validation, the frontend) can
 * mistake it for a finished, deliverable creative asset. Swap in a real
 * ImageGenerationProvider (see imageProviderFactory.ts) once one is
 * configured.
 */
export class MockImageProvider implements ImageGenerationProvider {
  readonly name = "mock-image-v1";

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const dimensions = ASPECT_RATIO_DIMENSIONS[request.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["4:5"];
    const headline = request.onScreenText || request.hook;
    const lines = wrapText(headline, 28).slice(0, 5);

    const textElements = lines
      .map(
        (line, i) =>
          `<text x="50%" y="${45 + i * 8}%" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#ffffff">${escapeXml(
            line
          )}</text>`
      )
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
  <rect width="100%" height="100%" fill="#1f2937"/>
  <text x="50%" y="10%" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#9ca3af">MOCK IMAGE - ${escapeXml(
    request.subtype
  )}</text>
  ${textElements}
  <text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#93c5fd">${escapeXml(request.cta)}</text>
</svg>`;

    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;

    return {
      provider: this.name,
      providerAssetId: `mock-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      url: dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      mimeType: "image/svg+xml",
      isMock: true,
      raw: { request },
    };
  }
}
