"use client";
import { useEffect, useRef } from "react";

/** Global single-key shortcuts, ignored while typing in a field or using modifier keys. */
export function useKeyboard(map: Record<string, (e: KeyboardEvent) => void>) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      // The scrubber handles its own arrow keys.
      if (e.key.startsWith("Arrow") && t.getAttribute("role") === "slider") return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const fn = ref.current[key] ?? ref.current[e.key];
      if (!fn) return;
      e.preventDefault();
      fn(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
