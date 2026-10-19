"use client";
import type { CalEvent } from "@/lib/calendar";

/** Start button for the simulated capture; wired up in the capture step. */
export function CaptureAction({ event, captured }: { event: CalEvent; captured: boolean }) {
  void event;
  void captured;
  return null;
}
