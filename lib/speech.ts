// Optional spoken playback via the browser's speechSynthesis. It only ever reads
// the simulated clock; nothing here writes to it, and no speech event gates it.

export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

export function loadVoices(): SpeechSynthesisVoice[] {
  try {
    return speechAvailable() ? window.speechSynthesis.getVoices() : [];
  } catch {
    return [];
  }
}

// macOS novelty voices: they are real voices, but unreadable as a meeting participant.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;

/** Distinct English voices, local ones first, so each speaker can get a different one. */
export function usableVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const seen = new Set<string>();
  const en = all.filter((v) => /^en([-_]|$)/i.test(v.lang) && !NOVELTY.test(v.name) && !seen.has(v.name) && !!seen.add(v.name));
  const pool = en.length ? en : all;
  return [...pool].sort((a, b) => Number(b.localService) - Number(a.localService));
}

/** Stable voice per speaker: the nth participant gets the nth voice (wrapping), and wrapped voices shift pitch. */
export function voiceFor(voices: SpeechSynthesisVoice[], participants: string[], speaker: string) {
  const i = Math.max(0, participants.indexOf(speaker));
  const voice = voices.length ? voices[i % voices.length] : undefined;
  const lap = voices.length ? Math.floor(i / voices.length) : 0;
  return { voice, pitch: Math.max(0.6, 1 - lap * 0.25) };
}

export function cancelSpeech() {
  try {
    if (speechAvailable()) window.speechSynthesis.cancel();
  } catch {}
}

// Chrome can garbage-collect an utterance before it ends and then never fire events; hold on to it.
let current: SpeechSynthesisUtterance | null = null;

export function speak(text: string, opts: { voice?: SpeechSynthesisVoice; pitch: number; rate: number; volume: number }) {
  try {
    if (!speechAvailable()) return;
    const u = new SpeechSynthesisUtterance(text);
    if (opts.voice) {
      u.voice = opts.voice;
      u.lang = opts.voice.lang;
    }
    u.pitch = opts.pitch;
    u.rate = Math.min(2, Math.max(0.5, opts.rate));
    u.volume = Math.min(1, Math.max(0, opts.volume));
    u.onend = u.onerror = () => {
      if (current === u) current = null;
    };
    current = u;
    window.speechSynthesis.speak(u);
  } catch {}
}
