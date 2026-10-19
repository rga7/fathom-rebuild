"use client";
import type { CaptureMode } from "@/data/types";
import { CAPTURE_OPTIONS } from "./capture";
import { useStored } from "./storage";

/** The capture mode picked in the Record dialog, remembered per browser. Nothing is recorded in any mode. */
export function useCaptureMode(): [CaptureMode, (m: CaptureMode) => void] {
  const [raw, set] = useStored<string>("capture-mode", "audio");
  const mode = CAPTURE_OPTIONS.some((o) => o.id === raw) ? (raw as CaptureMode) : "audio";
  return [mode, set];
}
