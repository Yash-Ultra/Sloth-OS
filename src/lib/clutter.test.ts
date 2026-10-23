import { describe, expect, it } from "vitest";

import { mergeSorted, parseClutterJson, tidyFile } from "./clutter";

describe("parseClutterJson", () => {
  it("reads the items array from a clean reply", () => {
    const reply = JSON.stringify({
      items: [
        {
          original: "a.pdf",
          clean_name: "a.pdf",
          target_folder: "/Archive",
          sloth_verdict: "fine",
        },
      ],
    });

    const parsed = parseClutterJson(reply);

    expect(parsed).toHaveLength(1);
    expect(parsed?.[0]?.clean_name).toBe("a.pdf");
  });

  it("recovers complete objects from a truncated, fenced reply", () => {
    const reply =
      '```json\n{"items":[{"original":"a.pdf","clean_name":"a.pdf","target_folder":"/Archive","sloth_verdict":"fine"},{"original":"b.pdf';

    const parsed = parseClutterJson(reply);

    expect(parsed?.map((row) => row.original)).toEqual(["a.pdf"]);
  });

  it("returns null when the model wrote something unusable", () => {
    expect(parseClutterJson("sorry, I have no idea")).toBeNull();
  });
});

describe("mergeSorted", () => {
  it("keeps one row per input name and sorts the gaps locally", () => {
    const names = ["Screenshot_1.png", "urgent_tax_stuff.zip", "invoice (1).pdf"];
    const rows = mergeSorted(
      [
        {
          original: "Screenshot_1.png",
          clean_name: "shot.png",
          target_folder: "/Shots",
          sloth_verdict: "ok",
        },
      ],
      names,
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]?.clean_name).toBe("shot.png");
    expect(rows[1]?.target_folder).toBe("/Archive/2026_Taxes");
    expect(rows[2]?.original).toBe("invoice (1).pdf");
  });

  it("returns the local rules when the model returned nothing", () => {
    const rows = mergeSorted(null, ["final_FINAL_v9.pdf"]);

    expect(rows[0]?.target_folder).toBe("/Documents/Nightmare_Versions");
  });
});

describe("tidyFile", () => {
  it("files screenshots away from documents", () => {
    expect(tidyFile("Screenshot_2026_10_19_0341.png").target_folder).toBe("/Archive/Screenshots");
  });

  it("binbags newsletters", () => {
    expect(tidyFile("unread_newsletter_842.eml").target_folder).toBe("/Trash_It");
  });
});
