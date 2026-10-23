/**
 * Small client for a local Ollama server.
 *
 * The app runs one text model. A vision model is optional and is only used by
 * the fridge scanner when one is installed and configured.
 */

const env = import.meta.env;

export const OLLAMA_HOST = (env["VITE_OLLAMA_HOST"] || "http://localhost:11434").replace(
  /\/+$/,
  "",
);
export const TEXT_MODEL = (env["VITE_OLLAMA_MODEL"] || "llama3.2:3b").trim();
export const VISION_MODEL = (env["VITE_OLLAMA_VISION_MODEL"] || "").trim();

export type OllamaStatus = {
  online: boolean;
  host: string;
  /** Every model the server reports. */
  models: string[];
  /** The text model is installed and can be called. */
  ready: boolean;
  /** A vision model is configured and installed. */
  vision: boolean;
};

export type AskOptions = {
  prompt: string;
  system?: string;
  /** Base64 images. Ignored unless a vision model is available. */
  images?: string[];
  /** Constrain the reply to a JSON object. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type AskResult = {
  text: string;
  /** False when the model could not be reached, so the caller should use canned copy. */
  live: boolean;
  model: string | null;
  /** Wall-clock time spent on the request. */
  ms: number;
};

const STATUS_TTL_MS = 5000;
let cachedStatus: { at: number; status: OllamaStatus } | null = null;

function offlineStatus(): OllamaStatus {
  return { online: false, host: OLLAMA_HOST, models: [], ready: false, vision: false };
}

/** Treat `llama3.2` and `llama3.2:3b` as the same family. */
function sameModel(installed: string, wanted: string): boolean {
  if (!wanted) return false;
  if (installed === wanted) return true;
  const family = wanted.split(":")[0] ?? wanted;
  return installed === family || installed.startsWith(`${family}:`);
}

async function withTimeout<T>(ms: number, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Ping `/api/tags` and report whether the configured models are installed. */
export async function getStatus(force = false): Promise<OllamaStatus> {
  if (!force && cachedStatus && Date.now() - cachedStatus.at < STATUS_TTL_MS) {
    return cachedStatus.status;
  }

  let status: OllamaStatus;
  try {
    status = await withTimeout(3000, async (signal) => {
      const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal });
      if (!res.ok) throw new Error(`Ollama replied ${res.status}`);

      const body = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
      const models = (body.models ?? [])
        .map((entry) => entry.name ?? entry.model ?? "")
        .filter((name) => name.length > 0);

      return {
        online: true,
        host: OLLAMA_HOST,
        models,
        ready: models.some((name) => sameModel(name, TEXT_MODEL)),
        vision: models.some((name) => sameModel(name, VISION_MODEL)),
      };
    });
  } catch {
    status = offlineStatus();
  }

  cachedStatus = { at: Date.now(), status };
  return status;
}

/**
 * Send one prompt to the local model.
 *
 * Resolves with `live: false` instead of throwing when Ollama is down, the
 * model is missing, or the request times out. Every window has canned copy to
 * fall back on, so the UI stays usable without a model.
 */
export async function ask(options: AskOptions): Promise<AskResult> {
  const started = Date.now();
  const finish = (text: string, live: boolean, model: string | null): AskResult => ({
    text,
    live,
    model,
    ms: Date.now() - started,
  });

  const status = await getStatus();
  if (!status.online || !status.ready) return finish("", false, null);

  const useVision = Boolean(options.images?.length) && status.vision;
  const model = useVision ? VISION_MODEL : TEXT_MODEL;
  const timeoutMs = options.timeoutMs ?? (useVision ? 45_000 : 25_000);

  const body: Record<string, unknown> = {
    model,
    prompt: options.prompt,
    stream: false,
    keep_alive: "30m",
    options: {
      temperature: options.temperature ?? 0.8,
      num_predict: options.maxTokens ?? 220,
    },
  };
  if (options.system) body["system"] = options.system;
  if (options.json) body["format"] = "json";
  if (useVision) body["images"] = options.images;

  try {
    const text = await withTimeout(timeoutMs, async (signal) => {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw new Error(`Ollama replied ${res.status}`);

      const data = (await res.json()) as { response?: string };
      return String(data.response ?? "").trim();
    });

    if (!text) throw new Error("empty response");
    return finish(text, true, model);
  } catch {
    return finish("", false, null);
  }
}
