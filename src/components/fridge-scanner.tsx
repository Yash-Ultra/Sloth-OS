import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { useChore } from "@/hooks/use-chore";
import { drawSadFridge, FRIDGE_FALLBACK, parseFridge, type FridgeResult } from "@/lib/fridge";
import { getStatus, type AskOptions } from "@/lib/ollama";
import { FRIDGE_TEXT_PROMPT, FRIDGE_VISION_PROMPT } from "@/lib/prompts";
import { neonButton, pinkButton } from "./button-styles";
import { LiveStatus } from "./live-status";

/** `data:image/png;base64,AAAA` → `AAAA` */
function toBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export function FridgeScanner() {
  const { busy, status, run } = useChore();
  const fileInput = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<FridgeResult | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [ordered, setOrdered] = useState(false);

  const reset = () => {
    setImage(null);
    setResult(null);
    setChecked([]);
    setOrdered(false);
  };

  const readFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setResult(null);
      setChecked([]);
      setOrdered(false);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    readFile(event.dataTransfer.files[0]);
  };

  const scan = async () => {
    if (!image) return;

    const connection = await getStatus();
    const canSee = connection.online && connection.vision;

    const request: AskOptions = {
      prompt: canSee ? FRIDGE_VISION_PROMPT : FRIDGE_TEXT_PROMPT,
      maxTokens: 220,
      timeoutMs: 45_000,
    };
    if (canSee) request.images = [toBase64(image)];

    await run(
      request,
      (text) => setResult(parseFridge(text)),
      () => setResult(FRIDGE_FALLBACK),
    );
  };

  const toggle = (index: number) =>
    setChecked((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );

  return (
    <div className="flex flex-1 flex-col gap-3">
      <h2 className="font-display text-lg text-accent glow-pink">📸 Fridge Vision Scanner</h2>

      {image ? (
        <div className="flex flex-1 flex-col gap-3">
          <img
            src={image}
            alt="Fridge"
            className="max-h-44 w-full rounded-md border border-border object-contain"
          />
          <div className="flex gap-2">
            <button onClick={() => void scan()} disabled={busy} className={neonButton}>
              {busy ? "🔍 Scanning…" : "🔍 Scan Fridge → Grocery List"}
            </button>
            <button onClick={reset} className={pinkButton}>
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-accent bg-accent/10" : "border-border"
          }`}
        >
          <span className="text-4xl">🧊</span>
          <p className="text-sm text-secondary">Drop a fridge photo here, or click to upload</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setImage(drawSadFridge());
              setResult(null);
              setChecked([]);
              setOrdered(false);
            }}
            className={pinkButton}
          >
            Use Sample Sad Fridge Photo
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <ul className="space-y-1">
            {result.items.map((item, index) => (
              <li key={`${item}-${index}`}>
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted/70"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-border">
                    {checked.includes(index) ? "✓" : ""}
                  </span>
                  <span className={checked.includes(index) ? "line-through opacity-50" : ""}>
                    {item}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="rounded-md border border-secondary/40 bg-secondary/10 px-3 py-2 text-xs text-secondary">
            🍽️ <span className="font-bold">Meal:</span> {result.meal}
          </p>

          <div className="flex items-center gap-2">
            <button onClick={() => setOrdered(true)} className={pinkButton}>
              🛒 Auto-Order (In My Dreams)
            </button>
            {ordered && (
              <span className="text-[11px] text-accent">
                Order placed in a parallel universe. You still have to walk.
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <LiveStatus status={status} />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => readFile(event.target.files?.[0])}
      />
    </div>
  );
}
