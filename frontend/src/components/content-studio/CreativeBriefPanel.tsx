import { AlertTriangle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { CreativeBrief } from "@/lib/api/types";
import { goalLabel } from "@/lib/utils/labels";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { VisualDirectionPanel } from "./VisualDirectionPanel";

interface CreativeBriefPanelProps {
  /** undefined while the persisted brief is still loading; null once loaded and confirmed not to exist. */
  brief: CreativeBrief | null | undefined;
  isLoadingBrief: boolean;
  isGenerating: boolean;
  generationError: ApiError | null;
  onGenerate: () => void;
}

/** Never surfaces raw backend error text for a configuration failure - just that AI generation isn't set up yet. */
function describeGenerationError(error: ApiError): string {
  if (error.status === 503) {
    return "AI content generation isn't configured yet for this workspace. Please contact your workspace admin.";
  }
  if (error.status === 401 || error.status === 403) {
    return "You're not authorized to generate a creative brief for this content item.";
  }
  if (error.status === 502) {
    return "The AI creative direction request failed upstream. Please try again in a moment.";
  }
  return error.message;
}

export function CreativeBriefPanel({ brief, isLoadingBrief, isGenerating, generationError, onGenerate }: CreativeBriefPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Creative Brief — AI Creative Direction</CardTitle>
        {brief && !isGenerating && (
          <Button variant="ghost" size="sm" onClick={onGenerate}>
            <RefreshCw className="size-3.5" aria-hidden />
            Regenerate
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingBrief && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!isLoadingBrief && isGenerating && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
            <p className="text-sm font-medium text-foreground">AI is building your creative direction...</p>
          </div>
        )}

        {!isLoadingBrief && !isGenerating && generationError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-danger/20 bg-danger-muted px-6 py-8 text-center">
            <AlertTriangle className="size-6 text-danger" aria-hidden />
            <p className="max-w-sm text-sm text-foreground">{describeGenerationError(generationError)}</p>
            <Button onClick={onGenerate} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!isLoadingBrief && !isGenerating && !generationError && !brief && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-foreground-muted">
              AI will create the visual and creative direction based on the finalized content strategy.
            </p>
            <Button onClick={onGenerate}>Generate Creative Brief</Button>
          </div>
        )}

        {!isLoadingBrief && !isGenerating && !generationError && brief && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Objective</p>
                <p className="mt-0.5 text-sm text-foreground">{goalLabel(brief.objective)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Target Audience</p>
                <p className="mt-0.5 text-sm text-foreground">{brief.targetAudience}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Tone of Voice</p>
                <p className="mt-0.5 text-sm text-foreground">{brief.toneOfVoice ?? "—"}</p>
              </div>
            </div>

            <VisualDirectionPanel direction={brief.visualDirection} />

            {brief.generationRequirements.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Generation Requirements</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {brief.generationRequirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
