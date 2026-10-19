"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; text: string };
const Ctx = createContext<(text: string) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

/** Copy text and confirm with a toast. Falls back to a hidden textarea when the Clipboard API is unavailable. */
export function useCopy() {
  const toast = useToast();
  return useCallback(
    async (text: string, message = "Copied to clipboard") => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand("copy");
          ta.remove();
        } catch {
          ok = false;
        }
      }
      toast(ok ? message : "Couldn't access the clipboard");
    },
    [toast],
  );
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const push = useCallback((text: string) => {
    const id = next.current++;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-md border border-line-2 bg-raised px-3 py-2 text-[13px] text-fg shadow-xl shadow-black/40">
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
