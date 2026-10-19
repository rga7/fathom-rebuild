"use client";
import { useCallback, useMemo } from "react";
import type { Meeting } from "@/data/types";
import { EMPTY_HIGHLIGHT_STATE, mergeHighlights, type Highlight, type HighlightState } from "@/lib/highlights";
import { useStored } from "@/lib/storage";
import type { HighlightApi } from "./context";

/** Default title: the note, else the opening words of the line the highlight starts on. */
export function defaultTitle(m: Meeting, start: number, note?: string): string {
  if (note?.trim()) return note.trim().slice(0, 120);
  const line = [...m.lines].reverse().find((l) => l.start <= start + 0.05) ?? m.lines[0];
  const words = line.text.split(/\s+/);
  return words.slice(0, 9).join(" ") + (words.length > 9 ? "…" : "");
}

export function useHighlights(m: Meeting): { highlights: Highlight[]; api: HighlightApi } {
  const [state, setState] = useStored<HighlightState>(`highlights:${m.id}`, EMPTY_HIGHLIGHT_STATE);
  const safe: HighlightState = {
    created: Array.isArray(state?.created) ? state.created : [],
    renamed: state?.renamed && typeof state.renamed === "object" ? state.renamed : {},
    deleted: Array.isArray(state?.deleted) ? state.deleted : [],
  };
  const highlights = useMemo(() => mergeHighlights(m, safe), [m, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback<HighlightApi["add"]>(
    ({ type, start, end, title, note }) => {
      const s = Math.max(0, Math.min(start, end));
      const e = Math.max(s + 1, Math.max(start, end));
      const h = { id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, type, start: s, end: e, title: title ?? defaultTitle(m, s, note), note };
      setState((prev) => ({ ...EMPTY_HIGHLIGHT_STATE, ...prev, created: [...(prev?.created ?? []), h] }));
      return { ...h, seeded: false };
    },
    [m, setState],
  );
  const rename = useCallback<HighlightApi["rename"]>(
    (id, title) => setState((prev) => ({ ...EMPTY_HIGHLIGHT_STATE, ...prev, renamed: { ...(prev?.renamed ?? {}), [id]: title.trim() || "Untitled" } })),
    [setState],
  );
  const remove = useCallback<HighlightApi["remove"]>(
    (id) =>
      setState((prev) => ({
        ...EMPTY_HIGHLIGHT_STATE,
        ...prev,
        created: (prev?.created ?? []).filter((h) => h.id !== id),
        deleted: id.startsWith("u") ? prev?.deleted ?? [] : [...(prev?.deleted ?? []), id],
      })),
    [setState],
  );
  const restoreSeeded = useCallback(() => setState((prev) => ({ ...EMPTY_HIGHLIGHT_STATE, ...prev, deleted: [] })), [setState]);
  const api = useMemo(() => ({ add, rename, remove, restoreSeeded }), [add, rename, remove, restoreSeeded]);
  return { highlights, api };
}
