import { ContentItem } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function ContentMessagePanel({ item }: { item: ContentItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Hook</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{item.hook}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Core Message</p>
          <p className="mt-0.5 text-sm text-foreground">{item.message}</p>
        </div>
        {item.keyPoints.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Key Points</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
              {item.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-lg bg-brand-muted px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">CTA</p>
          <p className="mt-0.5 text-sm font-semibold text-brand">{item.cta}</p>
        </div>
      </CardContent>
    </Card>
  );
}
