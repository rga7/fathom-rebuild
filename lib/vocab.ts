// Custom vocabulary: viewer-defined "heard → meant" fixes applied to transcript text.
export interface VocabEntry {
  from: string;
  to: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function pattern(entries: VocabEntry[]): RegExp | null {
  const valid = entries.filter((e) => e.from.trim());
  if (!valid.length) return null;
  // Longest first so "see are DTs" wins over "see".
  const alts = [...valid].sort((a, b) => b.from.length - a.from.length).map((e) => esc(e.from.trim()));
  return new RegExp(`(?<![\\w])(${alts.join("|")})(?![\\w])`, "gi");
}

export interface Segment {
  text: string;
  /** Original words when this segment was replaced by a vocabulary entry. */
  from?: string;
}

export function vocabSegments(text: string, entries: VocabEntry[]): Segment[] {
  const re = pattern(entries);
  if (!re) return [{ text }];
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const hit = entries.find((e) => e.from.trim().toLowerCase() === m[0].toLowerCase());
    if (!hit) continue;
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: hit.to, from: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export function applyVocab(text: string, entries: VocabEntry[]): string {
  return vocabSegments(text, entries)
    .map((s) => s.text)
    .join("");
}

export function countOccurrences(lines: { text: string }[], from: string): number {
  const re = pattern([{ from, to: "" }]);
  if (!re) return 0;
  return lines.reduce((n, l) => n + (l.text.match(re)?.length ?? 0), 0);
}
