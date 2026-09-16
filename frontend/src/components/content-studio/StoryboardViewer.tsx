import { Clock, Film } from "lucide-react";
import { MotionGraphicScene } from "@/lib/api/types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function SceneField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function StoryboardViewer({ scenes }: { scenes: MotionGraphicScene[] }) {
  return (
    <div className="flex flex-col gap-3">
      {scenes.map((scene) => (
        <Card key={scene.sceneNumber} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                {scene.sceneNumber}
              </span>
              <span className="text-sm font-semibold text-foreground">Scene {scene.sceneNumber}</span>
            </div>
            <Badge tone="neutral">
              <Clock className="size-3" aria-hidden />
              {scene.duration}s
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SceneField label="On-screen Text" value={scene.onScreenText} />
            <SceneField label="Narration" value={scene.narration} />
            <SceneField label="Visual Description" value={scene.visualDescription} />
            <SceneField label="Animation Instructions" value={scene.animationInstructions} />
            <SceneField label="Transition" value={scene.transition} />
            {scene.assetRequirements && scene.assetRequirements.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Asset Requirements</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {scene.assetRequirements.map((requirement) => (
                    <Badge key={requirement} tone="neutral">
                      <Film className="size-3" aria-hidden />
                      {requirement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
