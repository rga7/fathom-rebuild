// Turns a capture script into a full Meeting: line ids and times (same word-count timing as
// scripts/build-transcripts.mjs, without the jitter), then the precomputed notes.
import type { ActionItem, CaptureMode, Line, Meeting, SummaryBullet, SummarySection, TemplateId } from "../data/types.ts";
import type { CaptureKind } from "./calendar.ts";
import { CAPTURE_SCRIPTS, MEDDPICC_FIELDS, type CaptureScript } from "./captureScripts.ts";

const WORDS_PER_SEC = 2.6;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function scriptLines(script: CaptureScript): { lines: Line[]; byTag: Map<string, string> } {
  const byTag = new Map<string, string>();
  const lines: Line[] = [];
  let t = 2;
  script.lines.forEach(([speaker, text, tag], i) => {
    const id = `L${String(i + 1).padStart(3, "0")}`;
    if (i) t += lines[i - 1].speaker === speaker ? 0.25 : 0.7;
    const dur = Math.max(0.7, text.split(/\s+/).length / WORDS_PER_SEC);
    lines.push({ id, speaker, text, start: round1(t), end: round1(t + dur) });
    t += dur;
    if (tag) byTag.set(tag, id);
  });
  return { lines, byTag };
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DEFAULT_TEMPLATE: Record<CaptureKind, TemplateId> = {
  standup: "standup",
  one_on_one: "one_on_one",
  sales: "meddpicc",
  customer: "general",
  planning: "general",
};

export function compileCapture(opts: { kind: CaptureKind; id: string; title: string; startedAtMs: number; capture: CaptureMode }): Meeting {
  const script = CAPTURE_SCRIPTS[opts.kind];
  const { lines, byTag } = scriptLines(script);
  const need = (tag: string) => {
    const id = byTag.get(tag);
    if (!id) throw new Error(`capture script ${opts.kind}: unknown tag "${tag}"`);
    return id;
  };
  const started = new Date(opts.startedAtMs);

  const takeaways: SummaryBullet[] = script.takeaways.map((b) => ({ text: b.text, cite: need(b.tag) }));
  const actionItems: ActionItem[] = script.actions.map((a, i) => {
    const due = new Date(opts.startedAtMs);
    due.setDate(due.getDate() + a.days);
    return { id: `a${i + 1}`, text: a.text, owner: a.owner, due: ymd(due), sourceLineId: need(a.tag) };
  });
  const followUps: SummaryBullet[] = script.actions.map((a) => ({ text: a.text, cite: need(a.tag) }));

  const general: SummarySection[] = [
    { heading: "Meeting purpose", body: script.purpose },
    { heading: "Key takeaways", bullets: takeaways },
    ...(script.decisions ? [{ heading: "Decisions", bullets: script.decisions.map((d) => ({ text: d.text, cite: need(d.tag) })) }] : []),
  ];
  const meddpicc: SummarySection[] = script.meddpicc
    ? [{ heading: "MEDDPICC", bullets: MEDDPICC_FIELDS.map((f) => ({ lead: f, ...(script.meddpicc![f] ? { text: script.meddpicc![f]!.text, cite: need(script.meddpicc![f]!.tag) } : { text: "Not discussed." }) })) }]
    : [
        { heading: "Format note", body: "This call had no sales context. MEDDPICC fields were not discussed." },
        { heading: "MEDDPICC", bullets: MEDDPICC_FIELDS.map((f) => ({ lead: f, text: "Not discussed." })) },
      ];

  return {
    id: opts.id,
    shareToken: "",
    title: opts.title,
    kind: script.meetingKind,
    origin: "simulated-capture",
    capture: opts.capture,
    startedAt: started.toISOString(),
    hostId: "jordan",
    participants: [...new Set(lines.map((l) => l.speaker))],
    snippet: script.snippet,
    lines,
    defaultTemplate: DEFAULT_TEMPLATE[opts.kind],
    summaries: {
      general,
      one_on_one: [{ heading: "Topics", bullets: takeaways }, { heading: "Follow-ups", bullets: followUps }],
      standup: [{ heading: "Updates", bullets: takeaways }, { heading: "Blockers and follow-ups", bullets: followUps }],
      meddpicc,
    },
    actionItems,
    questions: script.questions.map((q, i) => ({ id: `q${i + 1}`, lineId: need(q.tag), answered: q.answered })),
    chapters: script.chapters.map((c, i) => ({ id: `c${i + 1}`, title: c.title, startLineId: need(c.tag) })),
    decisions: (script.decisions ?? []).map((d) => ({ text: d.text, lineId: need(d.tag) })),
    followUpEmail: script.email,
    suggestedPrompts: script.prompts,
    highlights: [],
    scratchpad: "",
    vocabSuggestions: [],
  };
}

export function scriptDuration(kind: CaptureKind): number {
  const { lines } = scriptLines(CAPTURE_SCRIPTS[kind]);
  return lines[lines.length - 1].end;
}
