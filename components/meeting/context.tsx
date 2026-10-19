"use client";
import { createContext, useContext, type RefObject } from "react";
import type { HighlightType, Meeting } from "@/data/types";
import type { Highlight } from "@/lib/highlights";

export type TabId = "summary" | "actions" | "transcript" | "highlights" | "questions" | "scratchpad";

export interface MeetingCtx {
  meeting: Meeting;
  /** Shared (signed-out) view: read-only, no scratchpad. */
  shared: boolean;
  tab: TabId;
  setTab: (t: TabId) => void;
  /** False for transcript-only calls: no player, so nothing can seek or play. */
  playback: boolean;
  /** Seek the player to a time and start playing. */
  seekTo: (t: number) => void;
  /** Transcript search box, focused by the "/" shortcut. */
  searchRef: RefObject<HTMLInputElement | null>;
  highlights: Highlight[];
  /** Absent on shared pages, which are read-only. */
  highlightApi?: HighlightApi;
}

export interface HighlightApi {
  add: (h: { type: HighlightType; start: number; end: number; title?: string; note?: string }) => Highlight;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  restoreSeeded: () => void;
}

export const MeetingContext = createContext<MeetingCtx | null>(null);

export function useMeeting(): MeetingCtx {
  const c = useContext(MeetingContext);
  if (!c) throw new Error("useMeeting outside MeetingContext");
  return c;
}
