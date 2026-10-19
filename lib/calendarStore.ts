"use client";
// Per-viewer calendar state. All of it lives in localStorage (via useStored, which wraps
// every access in try/catch) and works with empty storage: not connected, auto-capture off.
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, demoEvents, type CalEvent, type CalSettings, type CalSource, type Overrides } from "./calendar";
import { useStored } from "./storage";

const NO_SOURCE: CalSource | null = null;
const NO_OVERRIDES: Overrides = {};

export function useCalSource() {
  return useStored<CalSource | null>("cal-source", NO_SOURCE);
}
export function useCalSettings(): [CalSettings, (patch: Partial<CalSettings>) => void] {
  const [raw, set] = useStored<Partial<CalSettings>>("cal-settings", DEFAULT_SETTINGS);
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...raw }), [raw]);
  return [settings, (patch) => set((p) => ({ ...DEFAULT_SETTINGS, ...p, ...patch }))];
}
export function useOverrides() {
  return useStored<Overrides>("cal-overrides", NO_OVERRIDES);
}

// Fixed per page load, so the demo calendar doesn't shift under the viewer as components re-render.
let demoBase: number | null = null;
const getDemoBase = () => (demoBase ??= Date.now());

/** Current time in ms, refreshed every `intervalMs`. Null until mounted, so server and first client render agree. */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useCalEvents(): { source: CalSource | null; events: CalEvent[] } {
  const [source] = useCalSource();
  const events = useMemo(() => {
    if (!source) return [];
    return source.kind === "demo" ? demoEvents(getDemoBase()) : source.events;
  }, [source]);
  return { source, events };
}
