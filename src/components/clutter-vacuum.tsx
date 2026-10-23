import { motion } from "framer-motion";
import { useState } from "react";

import { useChore } from "@/hooks/use-chore";
import {
  CLUTTER_SAMPLES,
  mergeSorted,
  parseClutterJson,
  tidyAll,
  type SortedItem,
} from "@/lib/clutter";
import { CLUTTER_SYSTEM, clutterPrompt } from "@/lib/prompts";
import { neonButton, pinkButton } from "./button-styles";
import { LiveStatus } from "./live-status";

function folderColor(folder: string): string {
  const name = folder.toLowerCase();
  if (name.includes("trash")) return "bg-red-500/20 text-red-200 border-red-400/40";
  if (name.includes("tax")) return "bg-amber-500/20 text-amber-200 border-amber-400/40";
  if (name.includes("screenshot")) return "bg-cyan-500/20 text-cyan-200 border-cyan-400/40";
  if (name.includes("nightmare") || name.includes("document")) {
    return "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40";
  }
  return "bg-emerald-500/20 text-emerald-200 border-emerald-400/40";
}

export function ClutterVacuum() {
  const { busy, status, run } = useChore();
  const [names, setNames] = useState<string[]>(() => [...CLUTTER_SAMPLES]);
  const [custom, setCustom] = useState("");
  const [sorted, setSorted] = useState<SortedItem[] | null>(null);

  const addCustom = () => {
    const extra = custom
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (extra.length) {
      setNames((current) => [...current, ...extra.filter((name) => !current.includes(name))]);
      setSorted(null);
    }
    setCustom("");
  };

  const tidy = () => {
    if (!names.length) return;

    void run(
      {
        prompt: clutterPrompt(names),
        system: CLUTTER_SYSTEM,
        json: true,
        temperature: 0.2,
        maxTokens: 900,
      },
      (text) => {
        const parsed = parseClutterJson(text);
        setSorted(parsed && parsed.length > 0 ? mergeSorted(parsed, names) : tidyAll(names));
      },
      () => setSorted(tidyAll(names)),
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-secondary glow-cyan">🧹 Clutter Tidier</h2>
        <button onClick={tidy} disabled={busy || !names.length} className={neonButton}>
          {busy ? "🧹 Sorting…" : "🧹 Auto-Sort & Rename Clutter"}
        </button>
      </div>

      <div className="flex gap-2">
        <textarea
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Paste more messy filenames / emails (one per line)…"
          aria-label="Extra filenames"
          className="h-16 flex-1 resize-none rounded-md border border-input bg-terminal p-2 font-mono text-xs text-primary outline-none placeholder:text-muted-foreground"
        />
        <button onClick={addCustom} className={pinkButton}>
          + Add
        </button>
      </div>

      <div className="min-h-[220px] flex-1 space-y-2 overflow-auto pr-1">
        {sorted
          ? sorted.map((item) => (
              <motion.div
                layout
                key={item.original}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="rounded-md border border-border bg-muted/40 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-[11px] text-muted-foreground line-through">
                    {item.original}
                  </span>
                  <span className="text-primary glow-green">→</span>
                  <span className="truncate font-mono text-xs text-primary glow-green">
                    {item.clean_name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${folderColor(item.target_folder)}`}
                  >
                    {item.target_folder}
                  </span>
                  <span className="truncate text-[11px] text-accent">{item.sloth_verdict}</span>
                </div>
              </motion.div>
            ))
          : names.map((name) => (
              <motion.div
                layout
                key={name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-md bg-muted/70 p-2"
              >
                <span className="text-accent">⚠</span>
                <span className="truncate font-mono text-xs text-muted-foreground line-through">
                  {name}
                </span>
              </motion.div>
            ))}
      </div>

      <LiveStatus status={status} />
    </div>
  );
}
