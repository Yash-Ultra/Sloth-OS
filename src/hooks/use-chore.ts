import { useCallback, useState } from "react";

import { useSlothActions } from "@/components/sloth-provider";
import { ask, type AskOptions } from "@/lib/ollama";

export type RunStatus = {
  live: boolean;
  model: string | null;
  ms: number;
};

const OFFLINE_PAUSE_MS = 900;

/**
 * Shared plumbing for the four chore windows: busy flag, run status, and the
 * laziness bookkeeping around each model call.
 *
 * `onLive` receives the model's text, `onOffline` renders the canned fallback.
 */
export function useChore() {
  const sloth = useSlothActions();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<RunStatus | null>(null);

  const run = useCallback(
    async (request: AskOptions, onLive: (text: string) => void, onOffline: () => void) => {
      setBusy(true);
      sloth.beginAutomation();

      try {
        const result = await ask(request);

        if (result.live) {
          sloth.registerPrompt();
          onLive(result.text);
        } else {
          // A short pause keeps the "working" state from flickering.
          await new Promise((resolve) => setTimeout(resolve, OFFLINE_PAUSE_MS));
          onOffline();
        }

        setStatus({ live: result.live, model: result.model, ms: result.ms });
      } finally {
        setBusy(false);
        sloth.endAutomation();
      }
    },
    [sloth],
  );

  return { busy, status, run };
}
