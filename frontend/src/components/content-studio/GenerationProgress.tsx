"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The current graphic/video providers resolve synchronously - a single
 * request either finishes or fails, with no intermediate step-by-step
 * progress reported by the backend (GenerationJob only exposes a single
 * `progress` number that jumps 0 -> 10 -> 100). Rather than fabricate a
 * step-by-step percentage the backend can't actually report, this shows
 * the real pipeline stages as context for what's happening conceptually
 * while the request is in flight (all pulsing together, not individually
 * faked as "done"), a REAL elapsed-time counter, and flips every stage to
 * complete together the moment the response actually comes back - because
 * by then, truthfully, every stage did complete.
 */
export function GenerationProgress({ title, stages }: { title: string; stages: string[] }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <Loader2 className="size-7 animate-spin text-brand" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-foreground-muted">{elapsedSeconds}s elapsed</p>
      </div>
      <ul className="flex w-full max-w-xs flex-col gap-2 text-left">
        {stages.map((stage) => (
          <li key={stage} className="flex items-center gap-2 text-sm text-foreground-muted animate-pulse-soft">
            <Circle className="size-3.5 shrink-0" aria-hidden />
            {stage}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GenerationComplete({ stages }: { stages: string[] }) {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-2 text-left">
      {stages.map((stage) => (
        <li key={stage} className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
          {stage}
        </li>
      ))}
    </ul>
  );
}
