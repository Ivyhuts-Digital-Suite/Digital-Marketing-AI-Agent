import { VideoGenerationOutcome, VideoGenerationProvider, VideoGenerationRequest } from "./videoProvider.interface";

/**
 * Development/mock video provider.
 *
 * Rather than fabricate a fake "finished" video file/URL, this provider is
 * explicit about what it actually produces: a JSON manifest of the
 * validated scene plan that a real provider (Gemini/Veo - see
 * geminiVideoProvider.ts - or Runway/Pika/Shotstack) would consume to
 * render the actual video. `isMock: true` and `mimeType: "application/json"`
 * make that unmistakable to any caller. Always resolves synchronously
 * (isAsync: false) - there is no operation to poll.
 */
export class MockVideoProvider implements VideoGenerationProvider {
  readonly name = "mock-video-v1";
  readonly isAsync = false;

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationOutcome> {
    const manifest = {
      note: "MOCK VIDEO PROVIDER - this is a scene manifest, not a rendered video file.",
      format: request.format,
      subtype: request.subtype,
      aspectRatio: request.aspectRatio,
      totalDuration: request.totalDuration,
      videoStyle: request.videoStyle,
      cta: request.cta,
      scenes: request.scenes,
    };

    const dataUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(manifest, null, 2), "utf-8").toString(
      "base64"
    )}`;

    return {
      status: "completed",
      result: {
        provider: this.name,
        providerAssetId: `mock-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        url: dataUrl,
        durationSeconds: request.totalDuration,
        mimeType: "application/json",
        isMock: true,
        raw: manifest,
      },
    };
  }
}
