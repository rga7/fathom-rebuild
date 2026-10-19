// Ask: extractive retrieval over seeded transcripts. No model call at runtime.
// Lines are ranked with BM25 (plus a little neighbour context and a boost for
// speakers named in the question); answers quote the top lines and every quote
// carries a citation to the exact line. A few question shapes (action items,
// questions, decisions, summary, follow-up email) are answered from the
// precomputed seed data instead, still with line citations.
import type { Line, Meeting, PersonId } from "../data/types.ts";
import { ME, PEOPLE, firstName } from "../data/people.ts";
import { chapterAt, lineById } from "./derive.ts";
import { dueLabel } from "./format.ts";

export type Scope = "this" | "mine" | "all";
export const SCOPE_LABEL: Record<Scope, string> = { this: "This call", mine: "My calls", all: "All calls" };

export interface Citation {
  meetingId: string;
  lineId: string;
  start: number;
  /** Chapter (or meeting) the moment belongs to. */
  topic: string;
  meetingTitle: string;
}

export interface AnswerPart {
  text: string;
  lead?: string;
  speaker?: PersonId;
  quote?: boolean;
  cite?: Citation;
}

export interface Answer {
  kind: "retrieval" | "actions" | "questions" | "decisions" | "summary" | "email" | "none";
  intro: string;
  parts: AnswerPart[];
  email?: { subject: string; body: string };
}

// Seed-time speech-to-text fixes, applied before indexing so "SOC 2" finds "sock two".
const CORRECTIONS: [RegExp, string][] = [
  [/\bsock two\b/gi, "SOC 2"],
  [/\bsamel\b/gi, "SAML"],
  [/\bsee are DTs\b/gi, "CRDTs"],
  [/\bpost gress\b/gi, "Postgres"],
  [/\bocta\b/gi, "Okta"],
  [/\bvector clucks\b/gi, "vector clocks"],
  [/\bidem potent\b/gi, "idempotent"],
  [/\bSQL light\b/gi, "SQLite"],
];

export function corrected(text: string): string {
  return CORRECTIONS.reduce((t, [re, to]) => t.replace(re, to), text);
}

const STOP = new Set(
  ("a an the and or but if of to in on at for with about from by as is are was were be been being do does did " +
    "doing have has had having i me my we our us you your he she they them their it its this that these those " +
    "what which who whom whose when where why how there here than then so too very can could should would will " +
    "just not no yes also into out up down over under again more most some any all each other such only same " +
    "say said tell told think thing things get got make made go going know like really okay yeah um uh call calls " +
    "meeting meetings talk talked discuss discussed mention mentioned happen happening happened status update latest").split(" "),
);

const SYNONYMS: Record<string, string[]> = {
  disagre: ["argu", "disput", "push"],
  decid: ["decision", "agre"],
  decision: ["decid"],
  risk: ["worri", "concern", "risk"],
  block: ["blocker", "stuck"],
  blocker: ["block"],
  price: ["pric", "cost", "expens"],
  pric: ["price", "cost"],
  launch: ["ga", "beta"],
  churn: ["leav", "lost"],
  timeline: ["date", "deadline", "when"],
};

function stem(w: string): string {
  let s = w;
  for (const suf of ["ments", "ment", "ings", "ing", "ies", "ed", "es", "s", "ly"]) {
    if (s.length - suf.length >= 3 && s.endsWith(suf)) {
      s = suf === "ies" ? s.slice(0, -3) + "y" : s.slice(0, -suf.length);
      break;
    }
  }
  if (s.length > 3 && s.endsWith("e")) s = s.slice(0, -1);
  return s;
}

export function tokenize(text: string): string[] {
  return corrected(text)
    .toLowerCase()
    .replace(/\bsoc[\s-]?(2|two)\b/g, "soc2")
    .replace(/[’']s\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w) && (w.length > 1 || /\d/.test(w)))
    .map(stem);
}

interface Doc {
  m: Meeting;
  i: number;
  line: Line;
  tf: Map<string, number>;
  len: number;
}

const docCache = new WeakMap<Meeting, Doc[]>();
function docsFor(m: Meeting): Doc[] {
  let d = docCache.get(m);
  if (!d) {
    d = m.lines.map((line, i) => {
      const toks = tokenize(line.text);
      const tf = new Map<string, number>();
      toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
      return { m, i, line, tf, len: toks.length };
    });
    docCache.set(m, d);
  }
  return d;
}

function namedPeople(q: string, meetings: Meeting[]): PersonId[] {
  const ids = new Set(meetings.flatMap((m) => m.participants));
  const words = new Set(q.toLowerCase().split(/[^a-z]+/));
  return [...ids].filter((id) => words.has(firstName(id).toLowerCase()));
}

function cite(m: Meeting, line: Line): Citation {
  return {
    meetingId: m.id,
    lineId: line.id,
    start: line.start,
    topic: chapterAt(m, line.start)?.title ?? m.title,
    meetingTitle: m.title,
  };
}

function citeId(m: Meeting, lineId: string): Citation | undefined {
  const l = lineById(m, lineId);
  return l ? cite(m, l) : undefined;
}

/** A short line reads badly alone, so pull in the same speaker's next line. */
function quoteFor(m: Meeting, i: number): string {
  const l = m.lines[i];
  let text = corrected(l.text);
  const next = m.lines[i + 1];
  if (text.split(/\s+/).length < 9 && next && next.speaker === l.speaker) text += " " + corrected(next.text);
  return text;
}

/** A matched question is only half an answer: include the next speaker's reply. */
function withReply(m: Meeting, i: number): AnswerPart[] {
  const l = m.lines[i];
  const parts: AnswerPart[] = [{ speaker: l.speaker, quote: true, text: quoteFor(m, i), cite: cite(m, l) }];
  if (!corrected(l.text).trim().endsWith("?")) return parts;
  const j = m.lines.findIndex((x, k) => k > i && x.speaker !== l.speaker);
  if (j > 0 && j - i <= 2) parts.push({ speaker: m.lines[j].speaker, quote: true, text: quoteFor(m, j), cite: cite(m, m.lines[j]) });
  return parts;
}

interface Ranked {
  doc: Doc;
  score: number;
}

function queryTerms(query: string, meetings: Meeting[]) {
  const named = namedPeople(query, meetings);
  const nameStems = new Set(named.map((id) => stem(firstName(id).toLowerCase())));
  const base = tokenize(query).filter((t) => !nameStems.has(t));
  const terms = new Map<string, number>();
  base.forEach((t) => {
    terms.set(t, 1);
    (SYNONYMS[t] ?? []).forEach((s) => !terms.has(s) && terms.set(s, 0.5));
  });
  return { named, base, terms };
}

interface BulletHit {
  m: Meeting;
  lead?: string;
  text: string;
  cite: string;
  hits: number;
}

/** Hand-written summary bullets (seed data) that share words with the question. */
function matchBullets(base: string[], meetings: Meeting[]): BulletHit[] {
  const out: BulletHit[] = [];
  for (const m of meetings) {
    const bullets = m.summaries.general.flatMap((s) => s.bullets ?? []).flatMap((x) => [x, ...(x.children ?? [])]);
    for (const bl of bullets) {
      if (!bl.cite) continue;
      const toks = new Set(tokenize(`${bl.lead ?? ""} ${bl.text}`));
      const hits = new Set(base.filter((t) => toks.has(t) || (SYNONYMS[t] ?? []).some((x) => toks.has(x)))).size;
      if (hits) out.push({ m, lead: bl.lead, text: bl.text, cite: bl.cite, hits });
    }
  }
  return out.sort((a, b) => b.hits - a.hits);
}

function rank(query: string, meetings: Meeting[]): Ranked[] {
  const { named, base, terms } = queryTerms(query, meetings);
  if (!terms.size && !named.length) return [];

  const docs = meetings.flatMap(docsFor);
  const N = docs.length || 1;
  const avg = docs.reduce((n, d) => n + d.len, 0) / N || 1;
  const df = new Map<string, number>();
  for (const t of terms.keys()) df.set(t, docs.filter((d) => d.tf.has(t)).length);

  const k1 = 1.2;
  const b = 0.75;
  const raw = docs.map((d) => {
    let s = 0;
    for (const [t, w] of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(t)! + 0.5) / (df.get(t)! + 0.5));
      s += w * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg)));
    }
    return s;
  });

  // Summary bullets are written by hand at seed time and cite a line; when one
  // matches the question, nudge its cited line up so the answer lands on it.
  const bonus = new Map<Doc, number>();
  for (const bh of matchBullets(base, meetings)) {
    const d = docsFor(bh.m).find((x) => x.line.id === bh.cite);
    if (d) bonus.set(d, (bonus.get(d) ?? 0) + 1.5 * bh.hits);
  }

  return docs
    .map((d, j) => {
      const prev = j > 0 && docs[j - 1].m === d.m ? raw[j - 1] : 0;
      const next = j < docs.length - 1 && docs[j + 1].m === d.m ? raw[j + 1] : 0;
      let s = raw[j] + 0.3 * (prev + next) + (bonus.get(d) ?? 0);
      if (named.includes(d.line.speaker)) s = s > 0 ? s * 1.6 + 0.5 : terms.size ? 0 : 0.4;
      if (d.len < 3) s *= 0.4;
      return { doc: d, score: s };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function pick(ranked: Ranked[], k: number): Ranked[] {
  const out: Ranked[] = [];
  for (const r of ranked) {
    if (out.length >= k) break;
    if (out.some((o) => o.doc.m === r.doc.m && Math.abs(o.doc.i - r.doc.i) <= 2)) continue;
    out.push(r);
  }
  return out;
}

function scopeText(scope: Scope, n: number): string {
  return scope === "this" ? "this call" : `${n} ${scope === "mine" ? "of your calls" : "calls"}`;
}

export function scopeMeetings(scope: Scope, current: Meeting | undefined, all: Meeting[]): Meeting[] {
  if (scope === "this") return current ? [current] : [];
  if (scope === "mine") return all.filter((m) => m.participants.includes(ME));
  return all;
}

const RE = {
  email: /\b(follow[- ]?up|email|e-mail|recap email)\b/i,
  actions: /\b(action items?|next steps?|to-?dos?|tasks?|assigned|follow-ups)\b/i,
  questions: /\b(questions?|unanswered|open items?|still open)\b/i,
  decisions: /\b(decide|decided|decision|decisions|agreed|agree on)\b/i,
  summary: /\b(summar\w*|takeaways?|recap|tl;?dr|overview|key points|highlights of)\b/i,
};

export function ask(query: string, scope: Scope, current: Meeting | undefined, all: Meeting[]): Answer {
  const meetings = scopeMeetings(scope, current, all);
  const q = query.trim();
  if (!q) return { kind: "none", intro: "Ask about anything said in your calls.", parts: [] };
  const where = scopeText(scope, meetings.length);
  const ranked = rank(q, meetings);
  const topMeetings = () => {
    const seen: Meeting[] = [];
    for (const r of ranked) if (!seen.includes(r.doc.m)) seen.push(r.doc.m);
    return seen.length ? seen : meetings;
  };

  if (RE.email.test(q)) {
    const m = scope === "this" ? current : topMeetings()[0];
    if (m) {
      return {
        kind: "email",
        intro: `Follow-up email for "${m.title}" (written at seed time from the summary and action items):`,
        parts: m.actionItems.slice(0, 3).map((a) => ({ text: a.text, lead: a.owner ? firstName(a.owner) : "Unassigned", cite: citeId(m, a.sourceLineId) })),
        email: m.followUpEmail,
      };
    }
  }

  if (RE.actions.test(q)) {
    const mine = /\b(my|mine|i)\b/i.test(q) && scope !== "this";
    const named = namedPeople(q, meetings);
    const parts: AnswerPart[] = [];
    for (const m of meetings) {
      for (const a of m.actionItems) {
        if (mine && a.owner !== ME) continue;
        if (named.length && (!a.owner || !named.includes(a.owner))) continue;
        parts.push({ lead: a.owner ? PEOPLE[a.owner]?.name ?? a.owner : "Unassigned", text: `${a.text}, due ${dueLabel(a.due)}`, cite: citeId(m, a.sourceLineId) });
      }
    }
    if (parts.length) {
      const who = mine ? "assigned to you " : named.length ? `for ${named.map(firstName).join(" and ")} ` : "";
      return { kind: "actions", intro: `${parts.length} action item${parts.length > 1 ? "s" : ""} ${who}in ${where}, each linked to the moment it was assigned:`, parts: parts.slice(0, 12) };
    }
  }

  if (RE.questions.test(q) && !RE.decisions.test(q)) {
    const openOnly = /\b(unanswered|open|still|left)\b/i.test(q);
    const parts: AnswerPart[] = [];
    for (const m of meetings) {
      for (const dq of m.questions) {
        if (openOnly && dq.answered) continue;
        const l = lineById(m, dq.lineId);
        if (!l) continue;
        parts.push({ speaker: l.speaker, quote: true, text: corrected(l.text), cite: cite(m, l) });
      }
    }
    if (parts.length) {
      return {
        kind: "questions",
        intro: openOnly
          ? `${parts.length} question${parts.length > 1 ? "s" : ""} in ${where} that nobody answered:`
          : `${parts.length} questions detected in ${where}:`,
        parts: parts.slice(0, 12),
      };
    }
  }

  if (RE.decisions.test(q)) {
    const qTerms = new Set(tokenize(q.replace(RE.decisions, "")));
    const all = meetings.flatMap((m) => m.decisions.map((d) => ({ m, d, hits: tokenize(d.text).filter((t) => qTerms.has(t)).length })));
    // A topic with no matching decision falls through to plain retrieval.
    const relevant = all.some((x) => x.hits) ? all.filter((x) => x.hits).sort((a, b) => b.hits - a.hits) : qTerms.size ? [] : all;
    if (relevant.length) {
      const parts: AnswerPart[] = relevant.slice(0, 6).map(({ m, d }) => ({ lead: "Decision", text: d.text, cite: citeId(m, d.lineId) }));
      const used = new Set(relevant.map((x) => x.d.lineId));
      const topical = rank(q.replace(RE.decisions, " "), meetings);
      for (const r of pick(topical, 6).filter((r) => !used.has(r.doc.line.id)).slice(0, 3)) {
        parts.push({ speaker: r.doc.line.speaker, quote: true, text: quoteFor(r.doc.m, r.doc.i), cite: cite(r.doc.m, r.doc.line) });
      }
      return { kind: "decisions", intro: `Decisions in ${where}${qTerms.size && all.some((x) => x.hits) ? " matching your question" : ""}, with supporting quotes:`, parts };
    }
  }

  if (RE.summary.test(q)) {
    if (meetings.length === 1) {
      const m = meetings[0];
      const take = m.summaries.general.find((s) => s.heading === "Key takeaways")?.bullets ?? [];
      return {
        kind: "summary",
        intro: `Key takeaways from "${m.title}" (precomputed summary; each point links to its source moment):`,
        parts: take.map((b) => ({ lead: b.lead, text: b.text, cite: b.cite ? citeId(m, b.cite) : undefined })),
      };
    }
    return {
      kind: "summary",
      intro: `One line per call across ${where}, newest first:`,
      parts: meetings.slice(0, 10).map((m) => ({ lead: m.title, text: m.snippet, cite: citeId(m, m.chapters[0]?.startLineId ?? m.lines[0].id) })),
    };
  }

  const top = pick(ranked, 5).filter((r) => r.score >= 0.8);
  if (!top.length) {
    return {
      kind: "none",
      intro: `Nothing in ${where} matches that. Answers come only from what was said in the transcripts, so try words a speaker would have used.`,
      parts: [],
    };
  }
  // Read in order: by meeting (best first), then by time.
  const order = [...new Set(top.map((r) => r.doc.m))];
  top.sort((a, b) => order.indexOf(a.doc.m) - order.indexOf(b.doc.m) || a.doc.i - b.doc.i);
  const callCount = order.length;
  const { base } = queryTerms(q, meetings);
  const best = matchBullets(base, meetings)[0];
  const titled = meetings.length > 1 ? meetings.find((m) => base.length && base.every((t) => tokenize(m.title).includes(t))) : undefined;
  const lead: AnswerPart[] = titled
    ? [{ lead: titled.title, text: titled.snippet, cite: citeId(titled, titled.chapters[0]?.startLineId ?? titled.lines[0].id) }]
    : best && best.hits >= Math.max(1, Math.ceil(base.length * 0.5))
      ? [{ lead: "From the summary", text: `${best.lead ? best.lead + ": " : ""}${best.text}`, cite: citeId(best.m, best.cite) }]
      : [];
  return {
    kind: "retrieval",
    intro:
      callCount > 1
        ? `The ${top.length} most relevant moments across ${callCount} calls:`
        : `The ${top.length} most relevant moment${top.length > 1 ? "s" : ""} in ${scope === "this" ? "this call" : `"${order[0].title}"`}:`,
    parts: [...lead, ...top.flatMap((r) => withReply(r.doc.m, r.doc.i))],
  };
}

export function answerToText(a: Answer): string {
  const lines = [a.intro, ""];
  for (const p of a.parts) {
    const who = p.speaker ? `${PEOPLE[p.speaker]?.name ?? p.speaker}: ` : p.lead ? `${p.lead}: ` : "";
    const body = p.quote ? `"${p.text}"` : p.text;
    lines.push(`- ${who}${body}${p.cite ? ` (${p.cite.topic} @ ${Math.floor(p.cite.start / 60)}:${String(Math.floor(p.cite.start % 60)).padStart(2, "0")})` : ""}`);
  }
  if (a.email) lines.push("", `Subject: ${a.email.subject}`, "", a.email.body);
  return lines.join("\n");
}
