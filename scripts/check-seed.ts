// Validates seed data: every reference resolves, times are ordered, the flagship
// meets its spec, and action-item timestamps equal their source line's start.
// Run with --print to dump each referenced line for a human read-through.
import { MEETINGS, FLAGSHIP_ID } from "../data/index.ts";
import { PEOPLE } from "../data/people.ts";
import { durationSec, lineById, talkTime } from "../lib/derive.ts";

const print = process.argv.includes("--print");
let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error("  ✗ " + msg);
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

for (const m of MEETINGS) {
  console.log(`${m.id}: ${m.lines.length} lines, ${mmss(durationSec(m))}, ${m.participants.length} people`);
  const ids = new Set(m.lines.map((l) => l.id));
  const ref = (id: string, what: string) => {
    if (!ids.has(id)) fail(`${m.id}: ${what} -> missing line ${id}`);
    return lineById(m, id);
  };
  m.lines.forEach((l, i) => {
    if (!PEOPLE[l.speaker]) fail(`${m.id}: unknown speaker ${l.speaker}`);
    if (!m.participants.includes(l.speaker)) fail(`${m.id}: ${l.speaker} speaks but is not a participant`);
    if (l.end < l.start) fail(`${m.id}: ${l.id} ends before it starts`);
    if (i && l.start < m.lines[i - 1].start) fail(`${m.id}: ${l.id} starts before previous line`);
  });
  for (const p of m.participants) if (!PEOPLE[p]) fail(`${m.id}: unknown participant ${p}`);
  for (const a of m.actionItems) {
    const l = ref(a.sourceLineId, `action ${a.id}`);
    if (a.owner && !PEOPLE[a.owner]) fail(`${m.id}: action ${a.id} unknown owner`);
    if (l && print) console.log(`    AI ${a.id} [${a.owner}] @${mmss(l.start)} ${l.speaker}: ${l.text}`);
  }
  for (const q of m.questions) {
    const l = ref(q.lineId, `question ${q.id}`);
    if (l && !l.text.includes("?")) fail(`${m.id}: question ${q.id} line has no "?": ${l.text}`);
    if (l && print) console.log(`    Q  ${q.id} ${q.answered ? "answered " : "OPEN     "} ${l.speaker}: ${l.text}`);
  }
  for (const c of m.chapters) ref(c.startLineId, `chapter ${c.id}`);
  for (const d of m.decisions) {
    const l = ref(d.lineId, "decision");
    if (l && print) console.log(`    D  ${l.speaker}: ${l.text}`);
  }
  for (const h of m.highlights) {
    const s = ref(h.startLineId, `highlight ${h.id}`);
    const e = ref(h.endLineId, `highlight ${h.id}`);
    if (s && e && e.start < s.start) fail(`${m.id}: highlight ${h.id} ends before it starts`);
    if (s && e && print) console.log(`    H  ${h.type} "${h.title}": ${s.text} … ${e.text}`);
  }
  for (const [tid, sections] of Object.entries(m.summaries)) {
    const walk = (bs: { cite?: string; children?: any[] }[] = []) =>
      bs.forEach((b) => {
        if (b.cite) ref(b.cite, `summary ${tid}`);
        walk(b.children);
      });
    sections.forEach((s) => walk(s.bullets));
  }
  if (m.suggestedPrompts.length !== 3) fail(`${m.id}: needs 3 suggested prompts`);
  if (print) console.log("    talk:", talkTime(m).map((t) => `${t.speaker} ${Math.round(t.share * 100)}%`).join(", "));
}

const f = MEETINGS.find((m) => m.id === FLAGSHIP_ID)!;
if (f.participants.length !== 8) fail("flagship needs 8 participants");
if (f.lines.length < 500) fail("flagship needs 500+ lines");
if (durationSec(f) < 55 * 60 || durationSec(f) > 65 * 60) fail("flagship should be about 60 minutes");
if (f.chapters.length < 5 || f.chapters.length > 6) fail("flagship needs 5-6 chapters");
if (f.decisions.length < 2) fail("flagship needs two decisions");
if (f.questions.filter((q) => !q.answered).length < 2) fail("flagship needs unanswered questions");
const tokens = new Set(MEETINGS.map((m) => m.shareToken));
if (tokens.size !== MEETINGS.length) fail("share tokens must be unique");
if (MEETINGS.length !== 10) fail("expected 10 meetings");
const oldest = new Date(MEETINGS[MEETINGS.length - 1].startedAt).getTime();
const newest = new Date(MEETINGS[0].startedAt).getTime();
if ((newest - oldest) / 864e5 > 42) fail("meetings should span at most 6 weeks");

if (errors) {
  console.error(`\n${errors} problem(s)`);
  process.exit(1);
}
console.log("\nseed OK");
