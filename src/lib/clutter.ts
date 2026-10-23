export type SortedItem = {
  original: string;
  clean_name: string;
  target_folder: string;
  sloth_verdict: string;
};

export const CLUTTER_SAMPLES = [
  "final_FINAL_v9_real(2).pdf",
  "Screenshot_2026_10_19_0341.png",
  "urgent_tax_stuff_maybe.zip",
  "unread_newsletter_842.eml",
  "IMG_0042_final_USE_THIS_ONE.jpg",
  "resume_v3_FINAL_ACTUALLY.docx",
  "invoice (1) (1) copy.pdf",
  "meeting_notes_????.txt",
];

/** Turn `my _ file(1).pdf` into something a tidy person would accept. */
function collapseSeparators(name: string): string {
  return name
    .replace(/[_\s]+/g, "_")
    .replace(/\._/g, ".")
    .replace(/\(\)/g, "")
    .trim();
}

interface Verdict {
  clean_name: string;
  target_folder: string;
  sloth_verdict: string;
}

function verdictFor(name: string): Verdict {
  const lower = name.toLowerCase();

  if (/(screenshot|\.png|\.jpe?g|img_)/.test(lower)) {
    return {
      clean_name: name.replace(/^screenshot[_-]?/i, "Screenshot_"),
      target_folder: "/Archive/Screenshots",
      sloth_verdict: "You will never open this again, but now it's sorted.",
    };
  }

  if (/(unread|newsletter|\.eml)/.test(lower)) {
    return {
      clean_name: `unsubscribe_me_${name.replace(/\D/g, "").slice(-4) || "0001"}.eml`,
      target_folder: "/Trash_It",
      sloth_verdict: "Unsubscribed. In your dreams, anyway.",
    };
  }

  if (/(tax|invoice|receipt)/.test(lower)) {
    return {
      clean_name: name.replace(/[()]+/g, ""),
      target_folder: "/Archive/2026_Taxes",
      sloth_verdict: "The IRS equivalent of a weighted blanket.",
    };
  }

  if (/(final|actual|resume|use_this_one|v\d+)/.test(lower)) {
    return {
      clean_name: name.replace(/_?(final|actual|use_this_one)/gi, "").replace(/v\d+/gi, "vFINAL"),
      target_folder: "/Documents/Nightmare_Versions",
      sloth_verdict: "v9? Respect. But nobody reads past v2.",
    };
  }

  if (/\.(zip|rar|7z)/.test(lower)) {
    return {
      clean_name: name,
      target_folder: "/Downloads/Mystery_Zips",
      sloth_verdict: "Password: 'probably on a sticky note'.",
    };
  }

  return {
    clean_name: name.replace(/[()]+/g, ""),
    target_folder: "/Documents/To_Ignore",
    sloth_verdict: "Someday. Probably not.",
  };
}

/** Rule-based sorting, used when the model is offline or returns junk. */
export function tidyFile(name: string): SortedItem {
  const verdict = verdictFor(name);
  return {
    original: name,
    clean_name: collapseSeparators(verdict.clean_name),
    target_folder: verdict.target_folder,
    sloth_verdict: verdict.sloth_verdict,
  };
}

export function tidyAll(names: string[]): SortedItem[] {
  return names.map(tidyFile);
}

/**
 * Keep one row per input name. Model rows are matched back to the original
 * filenames; anything missing or malformed is sorted by the local rules
 * instead of being dropped.
 */
export function mergeSorted(parsed: SortedItem[] | null, names: string[]): SortedItem[] {
  const rows = parsed ?? [];
  const exact = new Map<string, SortedItem>();
  for (const row of rows) {
    if (row.original) exact.set(row.original, row);
  }

  return names.map((name) => {
    const hit =
      exact.get(name) ??
      rows.find((row) => row.original.toLowerCase() === name.toLowerCase()) ??
      null;

    if (hit && hit.clean_name.trim().length > 0) {
      return {
        original: name,
        clean_name: hit.clean_name.trim(),
        target_folder: hit.target_folder.trim() || "/Documents/To_Ignore",
        sloth_verdict: hit.sloth_verdict.trim() || "Sorted. Eventually.",
      };
    }
    return tidyFile(name);
  });
}

function toRows(entries: unknown[]): SortedItem[] {
  return entries.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      original: String(row["original"] ?? ""),
      clean_name: String(row["clean_name"] ?? ""),
      target_folder: String(row["target_folder"] ?? "/Archive"),
      sloth_verdict: String(row["sloth_verdict"] ?? ""),
    };
  });
}

/**
 * Small models like to wrap JSON in markdown or get cut off mid-object, so
 * try the whole array first and then scrape complete objects.
 */
export function parseClutterJson(text: string): SortedItem[] | null {
  const cleaned = text.replace(/```(json)?/gi, "").trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
      if (Array.isArray(parsed)) return toRows(parsed);
    } catch {
      // fall through to the per-object recovery below
    }
  }

  const rows: SortedItem[] = [];
  for (const match of cleaned.matchAll(/\{[^{}]*\}/g)) {
    try {
      const [row] = toRows([JSON.parse(match[0])]);
      if (row && row.original && row.clean_name) rows.push(row);
    } catch {
      // skip malformed fragment
    }
  }
  return rows.length > 0 ? rows : null;
}
