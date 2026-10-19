import { MEETINGS } from "../data/index.ts";
import { ask } from "../lib/ask.ts";
for (const m of MEETINGS) for (const p of m.suggestedPrompts) {
  const a = ask(p, "this", m, MEETINGS);
  console.log(`${a.kind === "none" ? "EMPTY" : a.kind.padEnd(9)} ${String(a.parts.length).padStart(2)} | ${m.id} | ${p}`);
  if (process.argv.includes("-v")) a.parts.slice(0, 3).forEach((x) => console.log("      ", (x.lead ?? x.speaker) + ":", x.text.slice(0, 110)));
}
