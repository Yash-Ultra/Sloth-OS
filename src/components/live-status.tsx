import type { RunStatus } from "@/hooks/use-chore";

/** Shows whether the last run hit Ollama or the offline fallback. */
export function LiveStatus({ status }: { status: RunStatus | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">Local AI: idle</span>;

  if (!status.live) {
    return <span className="text-xs font-bold text-accent glow-pink">[OFFLINE FALLBACK]</span>;
  }

  return (
    <span className="text-xs font-bold text-secondary glow-cyan">
      [LIVE LOCAL OLLAMA · {status.model} · {(status.ms / 1000).toFixed(1)}s]
    </span>
  );
}
