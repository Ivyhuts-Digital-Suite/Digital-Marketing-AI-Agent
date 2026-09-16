import { ContentItem } from "@/lib/api/types";
import { funnelStageLabel, goalLabel } from "@/lib/utils/labels";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

function StrategyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function ContentStrategyPanel({ item }: { item: ContentItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Strategy</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StrategyField label="Marketing Goal" value={goalLabel(item.goal)} />
        <StrategyField label="Target Audience" value={item.persona.description} />
        <StrategyField label="Funnel Stage" value={funnelStageLabel(item.funnelStage)} />
        <StrategyField label="Content Pillar" value={item.contentPillar} />
        <StrategyField label="Topic" value={item.topic} />
        <StrategyField label="Angle" value={item.angle} />
      </CardContent>
    </Card>
  );
}
