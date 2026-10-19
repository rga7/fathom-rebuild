import type { CaptureMode, Meeting } from "@/data/types";

export const CAPTURE_OPTIONS: { id: CaptureMode; label: string; blurb: string }[] = [
  { id: "video", label: "Video & Audio", blurb: "Capture video, audio & screen sharing" },
  { id: "audio", label: "Audio", blurb: "Capture audio only" },
  { id: "transcript", label: "Transcript only", blurb: "Capture the transcript only. No recording is saved." },
];

export const NO_RECORDING_TIP = "Transcript only: no recording saved, so there is nothing to play";

export const isTranscriptOnly = (m: Meeting) => m.capture === "transcript";

/** Seeded transcript-only call (the solo recording), opened by the Record dialog in that mode. */
export const TRANSCRIPT_ONLY_SAMPLE = "sync-engine-walkthrough";
