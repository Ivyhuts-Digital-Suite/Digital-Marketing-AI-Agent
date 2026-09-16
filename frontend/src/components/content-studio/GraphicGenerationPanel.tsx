"use client";

import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { CreativeAsset } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { AssetActionsBar } from "./AssetActionsBar";
import { AssetPreview } from "./AssetPreview";
import { CarouselAssetGallery } from "./CarouselAssetGallery";
import { GenerationErrorState } from "./GenerationErrorState";
import { GenerationProgress } from "./GenerationProgress";

const GRAPHIC_STAGES = ["Understanding Creative Direction", "Creating Visual Concept", "Generating Graphic", "Validating Brand Alignment"];

interface GraphicGenerationPanelProps {
  assets: CreativeAsset[];
  /** Plan is "finalized" or "in_progress" - mirrors the same check the backend's generation router enforces server-side (see PlanNotReadyForGenerationError). */
  isPlanReady: boolean;
  hasBrief: boolean;
  isPending: boolean;
  error: ApiError | null;
  onGenerate: () => void;
}

export function GraphicGenerationPanel({ assets, isPlanReady, hasBrief, isPending, error, onGenerate }: GraphicGenerationPanelProps) {
  const isCarousel = assets.length > 1;
  const canGenerate = isPlanReady && hasBrief;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Graphic</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <GenerationProgress title="Creating your branded visual..." stages={GRAPHIC_STAGES} />}

        {!isPending && error && <GenerationErrorState error={error} onRetry={onGenerate} />}

        {!isPending && !error && assets.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-muted text-brand">
              <ImagePlus className="size-5" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-foreground-muted">
              {!isPlanReady
                ? "Finalize your Content Calendar before generating assets."
                : hasBrief
                ? "Generate a branded Instagram graphic from this creative brief."
                : "Generate a creative brief first, then create the graphic."}
            </p>
            {!isPlanReady ? (
              <Link href="/calendar">
                <Button>Go to Calendar</Button>
              </Link>
            ) : (
              <Button onClick={onGenerate} disabled={!canGenerate}>
                Generate Graphic
              </Button>
            )}
          </div>
        )}

        {!isPending && !error && assets.length > 0 && (
          <div className="flex flex-col gap-4">
            {isCarousel ? <CarouselAssetGallery assets={assets} /> : <AssetPreview asset={assets[0]} />}
            <AssetActionsBar onRegenerate={onGenerate} isRegenerating={isPending} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
