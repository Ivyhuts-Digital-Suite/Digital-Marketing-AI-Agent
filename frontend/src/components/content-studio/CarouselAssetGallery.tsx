"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreativeAsset } from "@/lib/api/types";
import { Button } from "../ui/Button";
import { AssetPreview } from "./AssetPreview";

/** Orders carousel slides by their generationConfig.slideIndex (falls back to creation order if missing). */
function sortSlides(assets: CreativeAsset[]): CreativeAsset[] {
  return [...assets].sort((a, b) => {
    const aIndex = typeof a.generationConfig?.slideIndex === "number" ? a.generationConfig.slideIndex : 0;
    const bIndex = typeof b.generationConfig?.slideIndex === "number" ? b.generationConfig.slideIndex : 0;
    return aIndex - bIndex;
  });
}

export function CarouselAssetGallery({ assets }: { assets: CreativeAsset[] }) {
  const slides = sortSlides(assets);
  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, slides.length - 1)];

  if (!current) return null;

  return (
    <div className="flex flex-col gap-3">
      <AssetPreview asset={current} />
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Button>
        <span className="text-sm font-medium text-foreground-muted">
          Slide {index + 1} / {slides.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIndex((value) => Math.min(slides.length - 1, value + 1))}
          disabled={index === slides.length - 1}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
