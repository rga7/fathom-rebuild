"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalEvent } from "@/lib/calendar";
import { useCaptureMode } from "@/lib/captureMode";
import { useLocalMeetings } from "@/lib/localMeetings";
import { meetingHref } from "@/lib/links";
import { IconRecord } from "../icons";

/** "Start simulated capture" for an event set to Auto. Skipped events can't be started until the toggle changes. */
export function CaptureAction({ event, captured }: { event: CalEvent; captured: boolean }) {
  const router = useRouter();
  const [mode] = useCaptureMode();
  const [records, api] = useLocalMeetings();
  const existing = records.find((r) => r.eventId === event.id);
  if (existing) {
    return (
      <Link
        href={meetingHref(existing.meeting.id)}
        className="flex w-full items-center justify-end gap-1.5 text-[12px] text-accent hover:underline"
        data-testid="capture-link"
      >
        {existing.status === "recording" ? "Resume simulated capture" : "Open simulated capture"}
      </Link>
    );
  }
  return (
    <div className="flex w-full items-center justify-end gap-2">
      {!captured && <span className="text-[11px] text-faint">Set to Auto to capture</span>}
      <button
        type="button"
        disabled={!captured}
        title={captured ? "Starts a scripted, simulated capture. Nothing is recorded." : "Not captured. Switch the toggle to Auto first."}
        onClick={() => router.push(meetingHref(api.start(event, mode)))}
        className="flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1 text-[12px] text-fg hover:border-faint disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-2"
      >
        <IconRecord size={12} className="text-red-400" /> Start simulated capture
      </button>
    </div>
  );
}
