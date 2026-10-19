"use client";
import { createContext, useContext, type RefObject } from "react";
import type { Meeting } from "@/data/types";

export type TabId = "summary" | "actions" | "transcript" | "highlights" | "questions" | "scratchpad";

export interface MeetingCtx {
  meeting: Meeting;
  /** Shared (signed-out) view: read-only, no scratchpad. */
  shared: boolean;
  tab: TabId;
  setTab: (t: TabId) => void;
  /** Seek the player to a time and start playing. */
  seekTo: (t: number) => void;
  /** Transcript search box, focused by the "/" shortcut. */
  searchRef: RefObject<HTMLInputElement | null>;
}

export const MeetingContext = createContext<MeetingCtx | null>(null);

export function useMeeting(): MeetingCtx {
  const c = useContext(MeetingContext);
  if (!c) throw new Error("useMeeting outside MeetingContext");
  return c;
}
