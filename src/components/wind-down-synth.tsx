import { useEffect, useRef, useState } from "react";

import { useChore } from "@/hooks/use-chore";
import { startRain, type AmbientHandle } from "@/lib/ambient";
import { BEDTIME_FALLBACK, BEDTIME_PROMPT } from "@/lib/prompts";
import { neonButton, pinkButton } from "./button-styles";
import { LiveStatus } from "./live-status";

export function WindDownSynth() {
  const { busy, status, run } = useChore();
  const ambient = useRef<AmbientHandle | null>(null);
  const [playing, setPlaying] = useState(false);
  const [story, setStory] = useState("");

  useEffect(() => {
    return () => {
      ambient.current?.close();
      ambient.current = null;
    };
  }, []);

  const toggleAmbient = () => {
    if (ambient.current) {
      ambient.current.stop();
      ambient.current = null;
      setPlaying(false);
      return;
    }

    const handle = startRain();
    if (!handle) return;

    ambient.current = handle;
    setPlaying(true);
  };

  const writeStory = () => {
    void run({ prompt: BEDTIME_PROMPT, temperature: 0.9, maxTokens: 260 }, setStory, () =>
      setStory(BEDTIME_FALLBACK),
    );
  };

  const readAloud = () => {
    if (!story || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story);
    utterance.rate = 0.75;
    utterance.pitch = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-primary glow-green">🌙 Wind-Down Synth</h2>
        <button onClick={toggleAmbient} className={playing ? pinkButton : neonButton}>
          {playing ? "⏸ Quiet Please" : "▶ Rain + 432Hz Drone"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          onClick={writeStory}
          disabled={busy}
          className="rounded-md border border-secondary px-3 py-4 text-sm font-bold text-secondary transition-all hover:shadow-[0_0_18px_var(--neon-cyan)] disabled:opacity-40"
        >
          {busy ? "🌙 Sloth is writing…" : "🌙 Generate Sloth Bedtime Story"}
        </button>

        <div className="rounded-md border border-border bg-terminal p-3 font-serif text-sm leading-relaxed text-foreground">
          {story ||
            "A sleepy sloth is standing by with a story about dodging deadlines in the rain."}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button onClick={readAloud} disabled={!story} className={neonButton}>
          🔊 Read It Aloud
        </button>
        <LiveStatus status={status} />
      </div>
    </div>
  );
}
