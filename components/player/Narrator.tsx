"use client";
import { useEffect, useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { activeLineIndex } from "@/lib/derive";
import { useStored } from "@/lib/storage";
import { cancelSpeech, loadVoices, speak, speechAvailable, usableVoices, voiceFor } from "@/lib/speech";
import { IconSpeaker } from "../icons";
import { usePlayerStore } from "./context";

const DEFAULT = { on: false, volume: 0.8 };

/**
 * Speaks the active transcript line while the simulated clock plays. It subscribes to the
 * store read-only: speech is cancelled on pause, seek and speed change, and is never waited on.
 */
export function Narrator({ meeting }: { meeting: Meeting }) {
  const store = usePlayerStore();
  const [pref, setPref] = useStored("speech", DEFAULT);
  const [supported, setSupported] = useState(false);
  const on = supported && pref.on;
  const volumeRef = useRef(pref.volume);
  volumeRef.current = pref.volume;

  useEffect(() => {
    setSupported(speechAvailable());
  }, []);

  useEffect(() => {
    if (!on) return;
    let voices = usableVoices(loadVoices());
    const refresh = () => {
      voices = usableVoices(loadVoices());
    };
    // Chrome fills the voice list asynchronously.
    try {
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
    } catch {}

    let spoken = -1;
    let lastTime = store.time;
    let lastRate = store.rate;

    const sync = () => {
      const { time, playing, rate } = store;
      const jumped = time < lastTime - 0.01 || time - lastTime > 0.75;
      const rateChanged = rate !== lastRate;
      lastTime = time;
      lastRate = rate;

      if (!playing || jumped || rateChanged) {
        cancelSpeech();
        // After a seek or speed change, the line we're inside is spoken again from its start.
        if (jumped || rateChanged || !playing) spoken = -1;
      }
      if (!playing) return;

      const idx = activeLineIndex(meeting.lines, time);
      if (idx < 0 || idx === spoken) return;
      spoken = idx;
      const line = meeting.lines[idx];
      const { voice, pitch } = voiceFor(voices, meeting.participants, line.speaker);
      cancelSpeech(); // never let lines queue up behind a long one
      speak(line.text, { voice, pitch, rate, volume: volumeRef.current });
    };
    const unsub = store.subscribe(sync);
    return () => {
      unsub();
      cancelSpeech();
      try {
        window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      } catch {}
    };
  }, [on, store, meeting]);

  // Leaving the page must not leave a voice talking.
  useEffect(() => cancelSpeech, []);

  if (!supported) return null;
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={pref.on}
        aria-label="Spoken playback"
        title={pref.on ? "Spoken playback on (browser voices)" : "Spoken playback off. Reads the transcript aloud with browser voices."}
        onClick={() => {
          // Safari only lets speech start after a user gesture; a silent utterance here unlocks it.
          if (!pref.on) speak(" ", { pitch: 1, rate: 1, volume: 0 });
          setPref((p) => ({ ...p, on: !p.on }));
        }}
        className={`rounded-md p-1.5 hover:bg-white/5 ${pref.on ? "text-accent" : "text-muted hover:text-fg"}`}
      >
        <IconSpeaker size={16} muted={!pref.on} />
      </button>
      {pref.on && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={pref.volume}
          onChange={(e) => setPref((p) => ({ ...p, volume: Number(e.target.value) }))}
          aria-label="Speech volume"
          className="h-1 w-14 accent-[#4f8cff]"
        />
      )}
    </span>
  );
}
