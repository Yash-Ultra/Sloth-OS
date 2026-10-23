export type FridgeResult = {
  items: string[];
  meal: string;
};

export const FRIDGE_FALLBACK: FridgeResult = {
  items: [
    "Spinach that owes you money",
    "A lemon that is now a fossil",
    "Hot sauce (running on fumes)",
    "Anything with actual calories",
    "Coconut water (single, lukewarm)",
  ],
  meal: "Sad Salad™: wilted lettuce + hot sauce, served at room temperature, zero prep.",
};

/** Pull a dash list and a `Meal:` line out of whatever the model wrote. */
export function parseFridge(text: string): FridgeResult {
  const items: string[] = [];
  let meal = "";

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (line.toLowerCase().startsWith("meal")) {
      meal = line.replace(/^meal\s*:?\s*/i, "").trim();
      continue;
    }

    const cleaned = line.replace(/^[-*•\d.)\s]+/, "").trim();
    if (cleaned.length > 1 && items.length < 5) items.push(cleaned);
  }

  return {
    items: items.length > 0 ? items : FRIDGE_FALLBACK.items,
    meal: meal || FRIDGE_FALLBACK.meal,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Draw the demo photo used by the "sample fridge" button, as a PNG data URL. */
export function drawSadFridge(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 640;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const background = ctx.createLinearGradient(0, 0, 0, 640);
  background.addColorStop(0, "#0b1220");
  background.addColorStop(1, "#16200f");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 480, 640);

  ctx.fillStyle = "#24303f";
  ctx.strokeStyle = "#39ff88";
  ctx.lineWidth = 3;
  roundRect(ctx, 90, 40, 300, 540, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0d151d";
  roundRect(ctx, 116, 118, 248, 436, 14);
  ctx.fill();

  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 6;
  for (const shelf of [250, 370, 490]) {
    ctx.beginPath();
    ctx.moveTo(120, shelf);
    ctx.lineTo(360, shelf);
    ctx.stroke();
  }

  // Half a lemon on the top shelf.
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.moveTo(150, 240);
  ctx.arc(150, 215, 24, Math.PI * 0.15, Math.PI * 0.85);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#c98a1e";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(150, 215);
    ctx.lineTo(150 + i * 8, 196);
    ctx.stroke();
  }

  // Hot sauce on the middle shelf.
  ctx.fillStyle = "#e6234b";
  roundRect(ctx, 250, 300, 34, 52, 6);
  ctx.fill();
  ctx.fillStyle = "#7a0f28";
  ctx.fillRect(258, 288, 18, 14);

  // Wilted lettuce on the bottom shelf.
  ctx.fillStyle = "#5a8f45";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(155 + i * 26, 470, 20, 14, i % 2 ? -0.4 : 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#39ff88";
  ctx.font = "600 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SAD FRIDGE", 240, 620);

  return canvas.toDataURL("image/png");
}
