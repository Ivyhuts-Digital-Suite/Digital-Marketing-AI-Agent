import { VisualDirection } from "@/lib/api/types";
import { Badge } from "../ui/Badge";

function DirectionField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function VisualDirectionPanel({ direction }: { direction: VisualDirection }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Visual Direction</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DirectionField label="Style" value={direction.style} />
        <DirectionField label="Mood" value={direction.mood} />
        <DirectionField label="Composition" value={direction.composition} />
        <DirectionField label="Color Guidance" value={direction.colorGuidance} />
        <DirectionField label="Typography Guidance" value={direction.typographyGuidance} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Aspect Ratio</p>
          <Badge tone="brand" className="mt-1">
            {direction.aspectRatio}
          </Badge>
        </div>
      </div>
      {direction.visualElements.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Visual Elements</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {direction.visualElements.map((element) => (
              <Badge key={element} tone="neutral">
                {element}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
