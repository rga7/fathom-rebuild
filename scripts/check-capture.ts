// Validates the simulated-capture scripts: every tag resolves, questions are questions,
// and the compiled meeting has the same shape as seeded ones.
import { CAPTURE_SCRIPTS } from "../lib/captureScripts.ts";
import { compileCapture, scriptLines } from "../lib/captureCompile.ts";
import { PEOPLE } from "../data/people.ts";

let bad = 0;
const fail = (m: string) => (console.error("FAIL", m), bad++);
for (const kind of Object.keys(CAPTURE_SCRIPTS) as (keyof typeof CAPTURE_SCRIPTS)[]) {
  const s = CAPTURE_SCRIPTS[kind];
  const { lines, byTag } = scriptLines(s);
  const m = compileCapture({ kind, id: "x", title: "t", startedAtMs: Date.UTC(2026, 9, 19, 17), capture: "audio" });
  for (const l of lines) if (!PEOPLE[l.speaker]) fail(`${kind}: unknown speaker ${l.speaker}`);
  if (lines.length < 18 || lines.length > 30) fail(`${kind}: ${lines.length} lines`);
  for (const q of m.questions) if (!lines.find((l) => l.id === q.lineId)!.text.includes("?")) fail(`${kind}: question line without "?" ${q.lineId}`);
  for (const a of m.actionItems) if (!lines.some((l) => l.id === a.sourceLineId)) fail(`${kind}: action ${a.id} source`);
  for (let i = 1; i < lines.length; i++) if (lines[i].start < lines[i - 1].start) fail(`${kind}: times not increasing at ${i}`);
  const dur = lines[lines.length - 1].end;
  console.log(`${kind}: ${lines.length} lines, ${Math.round(dur)}s, ${m.actionItems.length} actions, ${m.questions.length} questions, ${byTag.size} tags`);
}
process.exit(bad ? 1 : 0);
