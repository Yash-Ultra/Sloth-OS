import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useSloth } from "@/components/sloth-provider";
import { getStatus, OLLAMA_HOST, TEXT_MODEL, type OllamaStatus } from "@/lib/ollama";

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1">
      {children}
    </span>
  );
}

export function StatusBar() {
  const sloth = useSloth();
  const [status, setStatus] = useState<OllamaStatus>({
    online: false,
    host: OLLAMA_HOST,
    models: [],
    ready: false,
    vision: false,
  });
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async (force: boolean) => {
    setChecking(true);
    try {
      setStatus(await getStatus(force));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    const id = setInterval(() => void refresh(true), 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  const { online, ready } = status;
  const hostLabel = OLLAMA_HOST.replace(/^https?:\/\//, "").replace(/localhost/, "127.0.0.1");

  const state = !online ? "OFFLINE" : ready ? "ONLINE" : "MODEL MISSING";
  const dot = !online
    ? "bg-accent glow-pink"
    : ready
      ? "bg-primary glow-green"
      : "bg-secondary glow-cyan";

  return (
    <section className="relative z-10 mx-auto mt-4 max-w-7xl px-4 md:px-8">
      <div className="glass flex flex-col gap-3 rounded-xl p-3 text-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <p className="font-display text-secondary glow-cyan">WHY OPEN-SOURCE / LOCAL TELEMETRY</p>
          <button
            onClick={() => void refresh(true)}
            title="Re-check the Ollama server"
            aria-label="Re-check the Ollama server"
            className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <span className={checking ? "inline-block animate-spin" : "inline-block"}>↻</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span>Ollama: {state}</span>
            <span className="text-muted-foreground">({hostLabel})</span>
          </Pill>

          <Pill>
            <span className="text-muted-foreground">Model:</span>
            <span className="font-mono text-primary">{TEXT_MODEL}</span>
            {online && !ready && <span className="text-accent">ollama pull {TEXT_MODEL}</span>}
          </Pill>

          <Pill>
            <span>Cloud API Cost:</span>
            <span className="font-bold text-primary glow-green">
              ${sloth.moneySaved.toFixed(2)} Saved
            </span>
          </Pill>

          <Pill>
            <span>Data Leaked:</span>
            <span className="font-bold text-secondary">0 Bytes</span>
            <span className="text-muted-foreground">(100% Local Privacy)</span>
          </Pill>

          <Pill>
            <span>Local prompts:</span>
            <span className="font-bold text-primary">{sloth.promptsRun}</span>
          </Pill>
        </div>
      </div>
    </section>
  );
}
