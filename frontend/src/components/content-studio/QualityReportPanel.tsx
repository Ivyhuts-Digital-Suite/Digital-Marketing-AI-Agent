import { AlertTriangle, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { ContentQualityCheck, QualityCheckCategory } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const CATEGORY_LABELS: Record<string, string> = {
  strategyAlignment: "Strategy Alignment",
  messaging: "Messaging",
  brandSafety: "Brand Safety",
  instagramFit: "Instagram Fit",
  graphics: "Graphics",
  video: "Video",
};

function CategoryRow({ name, category }: { name: string; category: QualityCheckCategory }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {category.passed ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      )}
      <div>
        <p className="font-medium text-foreground">
          {CATEGORY_LABELS[name] ?? name} <span className="text-foreground-muted">({category.score}/100)</span>
        </p>
        {category.notes.length > 0 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-foreground-muted">
            {category.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface QualityReportPanelProps {
  check: ContentQualityCheck | null | undefined;
  isLoading: boolean;
  canRunCheck: boolean;
  isRunning: boolean;
  error?: ApiError | null;
  onRunCheck: () => void;
}

/** Phase 9 - Step 4/14/21: displays the persisted AI Quality Check report - never computes or displays a fabricated score, always the real record from the backend. */
export function QualityReportPanel({ check, isLoading, canRunCheck, isRunning, error, onRunCheck }: QualityReportPanelProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">AI Quality Report</h2>
        <Button size="sm" variant="outline" onClick={onRunCheck} disabled={!canRunCheck} isLoading={isRunning}>
          <Sparkles className="size-3.5" aria-hidden />
          {check ? "Re-run Quality Check" : "Run Quality Check"}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-foreground-muted">Loading...</p>}

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!isLoading && !check && !error && (
        <p className="text-sm text-foreground-muted">
          No quality check has been run yet. Run one once this item&apos;s content has finished generating.
        </p>
      )}

      {check && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-foreground">{check.score} / 100</span>
            <Badge tone={check.status === "PASS" ? "success" : "danger"}>
              {check.status === "PASS" ? <CheckCircle2 className="size-3" aria-hidden /> : <XCircle className="size-3" aria-hidden />}
              {check.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(check.checks).map(
              ([name, category]) => category && <CategoryRow key={name} name={name} category={category} />
            )}
          </div>

          {check.flaggedClaims.length > 0 && (
            <div className="rounded-lg border border-warning/40 bg-warning-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-warning">Flagged Claims</p>
              <ul className="mt-2 space-y-2">
                {check.flaggedClaims.map((claim, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium text-foreground">
                      &ldquo;{claim.claim}&rdquo; <span className="text-xs text-foreground-muted">({claim.type})</span>
                    </p>
                    <p className="text-xs text-foreground-muted">{claim.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {check.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Recommendations</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-foreground-muted">
                {check.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
