"use client";
// Meetings made by the simulated capture flow. They live in localStorage, in this browser only
// (there is no server), so they have no share links. All access goes through useStored.
import { useMemo } from "react";
import type { CaptureMode, Meeting } from "@/data/types";
import { classify, type CalEvent } from "./calendar";
import { compileCapture } from "./captureCompile";
import { readStored, useStored } from "./storage";

export interface LocalRecord {
  meeting: Meeting;
  status: "recording" | "done";
  /** Calendar event this capture came from, so one event can't be started twice. */
  eventId?: string;
  /** Seconds of the scripted call already streamed in, so a capture survives leaving the page. */
  progress: number;
}

export const LOCAL_KEY = "local-meetings";
const EMPTY: LocalRecord[] = [];
const MAX = 20;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

export function useLocalMeetings() {
  const [records, set] = useStored<LocalRecord[]>(LOCAL_KEY, EMPTY);
  const api = useMemo(
    () => ({
      /** Starts (or returns the id of the capture already running or finished for) an event. */
      start(event: CalEvent, capture: CaptureMode): string {
        const existing = readStored<LocalRecord[]>(LOCAL_KEY, EMPTY).find((r) => r.eventId === event.id);
        if (existing) return existing.meeting.id;
        const startedAtMs = Date.now();
        const id = `sim-${slug(event.title)}-${startedAtMs.toString(36)}`;
        const meeting = compileCapture({ kind: classify(event), id, title: event.title, startedAtMs, capture });
        set((prev) => [{ meeting, status: "recording" as const, eventId: event.id, progress: 0 }, ...prev].slice(0, MAX));
        return id;
      },
      update(id: string, patch: Partial<Pick<LocalRecord, "status" | "progress">>) {
        set((prev) => prev.map((r) => (r.meeting.id === id ? { ...r, ...patch } : r)));
      },
      remove(id: string) {
        set((prev) => prev.filter((r) => r.meeting.id !== id));
      },
    }),
    [set],
  );
  return [records, api] as const;
}
