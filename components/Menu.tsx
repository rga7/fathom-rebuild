"use client";
import { useEffect, useRef, useState } from "react";

/** Button + popover that closes on outside click or Escape. */
export function Menu({
  button,
  children,
  align = "left",
  className = "",
  panelClassName = "",
  label,
}: {
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right" | "auto";
  className?: string;
  panelClassName?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="contents">
        {button(open)}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[200px] rounded-lg border border-line-2 bg-raised p-1 shadow-2xl shadow-black/50 ${
            align === "right" ? "right-0" : align === "auto" ? "left-0 sm:left-auto sm:right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  children,
  active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-white/5 ${active ? "text-fg" : "text-muted hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">{children}</div>;
}
