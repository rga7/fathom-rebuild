"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { PlayerStore } from "./store";

const Ctx = createContext<PlayerStore | null>(null);

export function PlayerProvider({ duration, children }: { duration: number; children: React.ReactNode }) {
  const [store] = useState(() => new PlayerStore(duration));
  useEffect(() => () => store.destroy(), [store]);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePlayerStore(): PlayerStore {
  const s = useContext(Ctx);
  if (!s) throw new Error("usePlayerStore outside PlayerProvider");
  return s;
}

/** Subscribe to a derived value. Return primitives so React can skip unchanged frames. */
export function usePlayer<T>(select: (s: PlayerStore) => T): T {
  const s = usePlayerStore();
  return useSyncExternalStore(
    s.subscribe,
    () => select(s),
    () => select(s),
  );
}
