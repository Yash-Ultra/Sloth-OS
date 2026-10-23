const MEMBERS = [
  { name: "Karen", emoji: "🦩" },
  { name: "Dave", emoji: "🧢" },
  { name: "Priya", emoji: "🥑" },
  { name: "Marcus", emoji: "🚀" },
  { name: "Zoe", emoji: "🐸" },
  { name: "slothGPT", emoji: "🦥" },
] as const;

const MESSAGES = [
  "where are we meeting???",
  "did anyone actually do the thing",
  "i'm 5 min away (lying)",
  "ok but consider: a nap",
  "guys the group project is due tomorrow lol",
  "who has the notes from last time",
  "can we just order food and call it a meeting",
  "my phone is at 1% pray for me",
  "🔥🔥🔥🔥",
  "brb in 2 hours",
  "the wifi password is on the fridge",
  "has anyone seen my charger",
  "typing... *never sends*",
  "this could've been an email",
  "i'll do it tomorrow (again)",
  "voice note incoming (do not open)",
  "new plan: we wing it",
  "that meeting ran over by 3 hours",
  "does 6pm work or is that 'ambitious'",
  "sorry was muted the whole time",
  "just circling back",
  "per my last message (never read it)",
  "who invited the dog",
  "update: no update",
  "let's take this offline",
] as const;

const ATTACHMENTS = ["IMG_meme.jpg", "voice_note_rant.m4a", "final_v9_FINAL.pdf"] as const;

/** Build a deliberately chaotic group chat for the demo button. */
export function buildSampleChat(count = 300): string {
  const lines: string[] = [];

  for (let i = 0; i < count; i++) {
    const member = MEMBERS[i % MEMBERS.length]!;
    let message: string = MESSAGES[i % MESSAGES.length]!;

    if (i % 17 === 0) message = `attached: ${ATTACHMENTS[i % ATTACHMENTS.length]}`;
    if (i % 23 === 0) message = "…";
    if (i % 41 === 0) message = `${member.emoji} ${member.emoji} ${member.emoji}`;

    const hours = String(18 + (i % 6)).padStart(2, "0");
    const minutes = String((i * 7) % 60).padStart(2, "0");
    lines.push(`[${hours}:${minutes}] ${member.name}: ${message}`);
  }

  return lines.join("\n");
}
