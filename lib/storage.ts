"use client";
// Per-viewer state in localStorage. Every access is wrapped in try/catch: in a
// private window, with blocked site data, or during prerender, storage can be
// missing or throw. In that case we fall back to an in-memory copy so the page
// still works for the session, and reads return the fallback when empty.
import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "fathom-rebuild:";
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
const serverCache = new Map<string, unknown>();
let storageBroken = false;

function readRaw(key: string): string | null {
  if (!storageBroken) {
    try {
      return window.localStorage.getItem(PREFIX + key);
    } catch {
      storageBroken = true;
    }
  }
  return memory.get(key) ?? null;
}

function writeRaw(key: string, raw: string | null) {
  if (raw === null) memory.delete(key);
  else memory.set(key, raw);
  if (storageBroken) return;
  try {
    if (raw === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, raw);
  } catch {
    storageBroken = true;
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key?.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
  });
}

function snapshot<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: unknown = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value as T;
}

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return snapshot(key, fallback);
}

export function writeStored<T>(key: string, value: T | null) {
  writeRaw(key, value === null ? null : JSON.stringify(value));
  emit(key);
}

/** useState-like hook backed by localStorage. Renders `fallback` on the server and first paint. */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const subscribe = useCallback(
    (fn: () => void) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(fn);
      return () => set!.delete(fn);
    },
    [key],
  );
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => {
      if (!serverCache.has(key)) serverCache.set(key, fallback);
      return serverCache.get(key) as T;
    },
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = snapshot(key, fallback);
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStored(key, v);
    },
    // fallback is treated as constant per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}
