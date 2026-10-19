// Simulated playback clock. There is no audio or video: a requestAnimationFrame
// loop advances `time` by wall-clock delta × rate while playing.
export const RATES = [1, 1.25, 1.5, 2] as const;

export interface Clip {
  start: number;
  end: number;
}

export class PlayerStore {
  time = 0;
  playing = false;
  rate: number = 1;
  /** When set, playback stops at clip.end (shared highlight links). */
  clip: Clip | null = null;
  private listeners = new Set<() => void>();
  private raf = 0;
  private last = 0;

  constructor(public readonly duration: number) {}

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  play = () => {
    if (this.playing) return;
    if (this.time >= this.duration - 0.05) this.time = 0;
    if (this.clip && (this.time < this.clip.start || this.time >= this.clip.end - 0.05)) this.time = this.clip.start;
    this.playing = true;
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.step);
    this.emit();
  };

  pause = () => {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.emit();
  };

  toggle = () => (this.playing ? this.pause() : this.play());

  seek = (t: number, opts: { play?: boolean } = {}) => {
    this.time = Math.min(Math.max(0, t), this.duration);
    // Seeking outside a shared clip leaves clip mode.
    if (this.clip && (this.time < this.clip.start - 0.05 || this.time > this.clip.end)) this.clip = null;
    this.emit();
    if (opts.play) this.play();
  };

  skip = (delta: number) => this.seek(this.time + delta);

  setRate = (r: number) => {
    this.rate = r;
    this.emit();
  };

  cycleRate = () => {
    const i = RATES.indexOf(this.rate as (typeof RATES)[number]);
    this.setRate(RATES[(i + 1) % RATES.length]);
  };

  setClip = (clip: Clip | null) => {
    this.clip = clip;
    this.emit();
  };

  private step = (now: number) => {
    if (!this.playing) return;
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.time += dt * this.rate;
    const stopAt = this.clip ? this.clip.end : this.duration;
    if (this.time >= stopAt) {
      this.time = stopAt;
      this.playing = false;
      this.emit();
      return;
    }
    this.emit();
    this.raf = requestAnimationFrame(this.step);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    this.listeners.clear();
  }
}
