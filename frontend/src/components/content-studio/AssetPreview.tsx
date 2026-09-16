import { AlertTriangle, Download, ImageOff } from "lucide-react";
import { CreativeAsset } from "@/lib/api/types";
import { Badge } from "../ui/Badge";

function isRealVideo(asset: CreativeAsset): boolean {
  const mimeType = asset.mimeType ?? asset.metadata?.mimeType;
  return asset.type === "video" && asset.metadata?.isMock !== true && mimeType === "video/mp4" && Boolean(asset.url);
}

function isMockAsset(asset: CreativeAsset): boolean {
  return asset.metadata?.isMock === true;
}

export function AssetPreview({ asset }: { asset: CreativeAsset }) {
  const isImageLike = asset.type === "graphic" || asset.type === "image";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
        {isImageLike && asset.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.subtype ?? "Generated creative"} className="max-h-[520px] w-full object-contain" />
        ) : asset.type === "video" && isRealVideo(asset) && asset.url ? (
          <video controls className="max-h-[520px] w-full" src={asset.url} />
        ) : (
          <div className="flex w-full flex-col items-center gap-2 px-6 py-12 text-center">
            <ImageOff className="size-8 text-foreground-muted" aria-hidden />
            <p className="text-sm text-foreground-muted">No previewable file for this asset.</p>
          </div>
        )}

        {isMockAsset(asset) && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-warning-muted px-2.5 py-1 text-xs font-medium text-warning">
            <AlertTriangle className="size-3" aria-hidden />
            Development Preview — Mock Provider
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{asset.provider}</Badge>
          {asset.subtype && <Badge tone="neutral">{asset.subtype.replace(/_/g, " ")}</Badge>}
          <Badge tone={asset.status === "failed" ? "danger" : asset.status === "validated" ? "success" : "neutral"}>
            {asset.status}
          </Badge>
        </div>
        {asset.url && (
          <a
            href={asset.url}
            download={`${asset.subtype ?? asset.type}-${asset._id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Download className="size-3.5" aria-hidden />
            Download
          </a>
        )}
      </div>

      {asset.validation && (asset.validation.issues.length > 0 || asset.validation.suggestions.length > 0) && (
        <div className="rounded-lg border border-border bg-surface-muted p-3 text-xs">
          <p className="font-semibold uppercase tracking-wide text-foreground-muted">
            Brand Validation — {asset.validation.passed ? "Passed" : "Needs Review"}
            {typeof asset.validation.score === "number" && ` (${asset.validation.score}/100)`}
          </p>
          {asset.validation.issues.map((issue, index) => (
            <p key={index} className="mt-1 text-danger">
              {issue}
            </p>
          ))}
          {asset.validation.suggestions.map((suggestion, index) => (
            <p key={index} className="mt-1 text-foreground-muted">
              {suggestion}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { isMockAsset, isRealVideo };
