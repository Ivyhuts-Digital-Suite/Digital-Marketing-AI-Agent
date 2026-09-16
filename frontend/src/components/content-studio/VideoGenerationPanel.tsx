"use client";

import Link from "next/link";
import { AlertTriangle, Clapperboard } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { CreativeAsset, MotionGraphicScene, VideoScript } from "@/lib/api/types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { AssetActionsBar } from "./AssetActionsBar";
import { AssetPreview, isRealVideo } from "./AssetPreview";
import { GenerationErrorState } from "./GenerationErrorState";
import { GenerationProgress } from "./GenerationProgress";
import { StoryboardViewer } from "./StoryboardViewer";

const VIDEO_STAGES = ["Script", "Storyboard", "Scene Generation", "Video Assembly", "Brand Validation"];

interface VideoManifest {
  script?: VideoScript;
  scenes: MotionGraphicScene[];
}

function extractManifest(asset: CreativeAsset): VideoManifest | null {
  const config = asset.generationConfig;
  if (!config || !Array.isArray(config.scenes)) return null;
  return { script: config.script as VideoScript | undefined, scenes: config.scenes as MotionGraphicScene[] };
}

interface VideoGenerationPanelProps {
  assets: CreativeAsset[];
  /** Plan is "finalized" or "in_progress" - mirrors the same check the backend's generation router enforces server-side (see PlanNotReadyForGenerationError). */
  isPlanReady: boolean;
  hasBrief: boolean;
  isPending: boolean;
  error: ApiError | null;
  onGenerate: () => void;
}

export function VideoGenerationPanel({ assets, isPlanReady, hasBrief, isPending, error, onGenerate }: VideoGenerationPanelProps) {
  const realVideos = assets.filter(isRealVideo);
  const legacyAssets = assets.filter((asset) => !isRealVideo(asset));
  const asset = realVideos[0];
  const manifest = asset ? extractManifest(asset) : null;
  const canGenerate = isPlanReady && hasBrief;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motion Graphic Video</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <GenerationProgress title="Generating video with Gemini Veo…" stages={VIDEO_STAGES} />}

        {!isPending && error && <GenerationErrorState error={error} onRetry={onGenerate} />}

        {!isPending && !error && realVideos.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Clapperboard className="size-5" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-foreground-muted">
              {!isPlanReady
                ? "Finalize your Content Calendar before generating assets."
                : hasBrief
                ? legacyAssets.length > 0
                  ? "Legacy storyboards exist, but no rendered video has been generated yet."
                  : "Generate the script, storyboard, and motion graphic for this reel."
                : "Generate a creative brief first, then create the motion graphic."}
            </p>
            {!isPlanReady ? (
              <Link href="/calendar">
                <Button>Go to Calendar</Button>
              </Link>
            ) : (
              <Button onClick={onGenerate} disabled={!canGenerate}>
                Generate Video
              </Button>
            )}
          </div>
        )}

        {!isPending && !error && realVideos.length > 0 && (
          <div className="flex flex-col gap-5">
            {realVideos.map((video, index) => (
              <div key={video._id} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">Video Generation {realVideos.length - index}</p>
                <AssetPreview asset={video} />
              </div>
            ))}

            {manifest && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Motion Graphic Storyboard{manifest.script ? ` — ${manifest.script.totalDuration}s` : ""}
                </p>
                <StoryboardViewer scenes={manifest.scenes} />
              </div>
            )}

            <AssetActionsBar onRegenerate={onGenerate} isRegenerating={isPending} />
          </div>
        )}

        {!isPending && legacyAssets.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-muted px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Legacy storyboard — no rendered video</p>
              <p className="text-sm text-foreground-muted">Historical scene manifests are retained for reference and are not playable video assets.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
