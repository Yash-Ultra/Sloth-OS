import { useState } from "react";

import { useChore } from "@/hooks/use-chore";
import { CHAT_FALLBACK, CHAT_SYSTEM, chatPrompt } from "@/lib/prompts";
import { buildSampleChat } from "@/lib/sample-chat";
import { cyanButton, neonButton } from "./button-styles";
import { LiveStatus } from "./live-status";

export function ChatDaemon() {
  const { busy, status, run } = useChore();
  const [log, setLog] = useState("");
  const [output, setOutput] = useState("");

  const messageCount = log.split("\n").filter((line) => line.trim()).length;

  const digest = () => {
    const source = log.trim();
    if (!source) {
      setOutput("Paste a chat (or load the sample) first, sleepyhead.");
      return;
    }

    void run(
      {
        prompt: chatPrompt(source),
        system: CHAT_SYSTEM,
        temperature: 0.7,
        maxTokens: 160,
      },
      setOutput,
      () => setOutput(CHAT_FALLBACK),
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-primary glow-green">🦥 Group Chat Summarizer</h2>
        <button onClick={() => setLog(buildSampleChat(300))} className={cyanButton}>
          Load Sample 300-Message Chaos
        </button>
      </div>

      <textarea
        value={log}
        onChange={(event) => setLog(event.target.value)}
        placeholder="Paste a messy Discord / WhatsApp / Slack log here…"
        aria-label="Group chat log"
        className="h-40 w-full resize-none rounded-md border border-input bg-terminal p-3 font-mono text-xs leading-relaxed text-primary glow-green outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center justify-between gap-2">
        <button onClick={digest} disabled={busy || !log.trim()} className={neonButton}>
          {busy ? "🦥 Digesting…" : "🦥 Digest While I Nap"}
        </button>
        <span className="text-xs text-muted-foreground">{messageCount} msgs</span>
      </div>

      <pre className="min-h-[7rem] flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-terminal p-3 font-mono text-sm leading-relaxed text-primary glow-green">
        {busy
          ? "🦥 digesting the chaos… take your hands off the mouse."
          : output || "$ awaiting a nap-worthy chat…"}
      </pre>

      <LiveStatus status={status} />
    </div>
  );
}
