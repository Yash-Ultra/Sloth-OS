import { describe, expect, it } from "vitest";

import { FRIDGE_FALLBACK, parseFridge } from "./fridge";

describe("parseFridge", () => {
  it("turns a dash list and a Meal line into a result", () => {
    const reply = "- half a lemon\n- hot sauce\n- wilted lettuce\nMeal: Sad salad";

    expect(parseFridge(reply)).toEqual({
      items: ["half a lemon", "hot sauce", "wilted lettuce"],
      meal: "Sad salad",
    });
  });

  it("strips bullet characters and numbering", () => {
    expect(parseFridge("1. lemons\n• ice\n* hope").items).toEqual(["lemons", "ice", "hope"]);
  });

  it("falls back when the reply is empty", () => {
    const result = parseFridge("");

    expect(result.items).toHaveLength(FRIDGE_FALLBACK.items.length);
    expect(result.meal).toBe(FRIDGE_FALLBACK.meal);
  });
});
