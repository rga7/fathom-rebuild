import type { HighlightType, Meeting, SeedHighlight } from "../data/types.ts";
import { HIGHLIGHT_TYPES } from "../data/types.ts";
import { lineById } from "./derive.ts";

export const HIGHLIGHT_META: Record<HighlightType, { label: string; color: string; key: string }> = {
  action_item: { label: "Action item", color: "#e4e4e7", key: "1" },
  insight: { label: "Insight", color: "#60a5fa", key: "2" },
  positive: { label: "Positive", color: "#4ade80", key: "3" },
  feedback: { label: "Feedback", color: "#facc15", key: "4" },
  objection: { label: "Objection", color: "#f87171", key: "5" },
  tech_question: { label: "Tech question", color: "#c084fc", key: "6" },
  bookmark: { label: "Bookmark", color: "#fb923c", key: "7" },
};

export interface Highlight {
  id: string;
  type: HighlightType;
  start: number;
  end: number;
  title: string;
  note?: string;
  seeded: boolean;
}

/** Viewer's changes to a meeting's highlights, kept in localStorage. */
export interface HighlightState {
  created: Omit<Highlight, "seeded">[];
  renamed: Record<string, string>;
  deleted: string[];
}

export const EMPTY_HIGHLIGHT_STATE: HighlightState = { created: [], renamed: {}, deleted: [] };

export function seedHighlight(m: Meeting, h: SeedHighlight): Highlight {
  return {
    id: h.id,
    type: h.type,
    title: h.title,
    note: h.note,
    start: lineById(m, h.startLineId)?.start ?? 0,
    end: lineById(m, h.endLineId)?.end ?? 0,
    seeded: true,
  };
}

export function mergeHighlights(m: Meeting, state: HighlightState): Highlight[] {
  const all: Highlight[] = [
    ...m.highlights.map((h) => seedHighlight(m, h)),
    ...state.created.map((h) => ({ ...h, seeded: false })),
  ];
  return all
    .filter((h) => !state.deleted.includes(h.id))
    .map((h) => (state.renamed[h.id] ? { ...h, title: state.renamed[h.id] } : h))
    .sort((a, b) => a.start - b.start);
}

// Viewer-created highlights live in one browser's localStorage, so their share
// link has to carry the highlight itself: /share/h/c<base64url(json)>.
interface ClipPayload {
  k: string; // meeting share token
  y: number; // type index
  s: number;
  e: number;
  n: string;
}

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function highlightShareId(m: Meeting, h: Highlight): string {
  if (h.seeded) return h.id;
  const p: ClipPayload = {
    k: m.shareToken,
    y: HIGHLIGHT_TYPES.indexOf(h.type),
    s: Math.round(h.start * 10) / 10,
    e: Math.round(h.end * 10) / 10,
    n: h.title.slice(0, 120),
  };
  return "c" + b64urlEncode(JSON.stringify(p));
}

export interface DecodedClip {
  token: string;
  type: HighlightType;
  start: number;
  end: number;
  title: string;
}

export function decodeClip(id: string): DecodedClip | null {
  if (!id.startsWith("c")) return null;
  try {
    const p = JSON.parse(b64urlDecode(id.slice(1))) as ClipPayload;
    const type = HIGHLIGHT_TYPES[p.y];
    if (!type || typeof p.k !== "string" || !(p.e > p.s) || p.s < 0) return null;
    return { token: p.k, type, start: p.s, end: p.e, title: String(p.n ?? "Clip") };
  } catch {
    return null;
  }
}
