"use client";
import Link from "next/link";
import { useState } from "react";
import { CAPTURE_OPTIONS, TRANSCRIPT_ONLY_SAMPLE } from "@/lib/capture";
import { useCaptureMode } from "@/lib/captureMode";
import { FLAGSHIP_HREF, meetingHref } from "@/lib/links";
import { IconCheck, IconGear, IconLogo, IconRecord } from "./icons";
import { Modal } from "./Modal";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-fg">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
        <IconLogo size={18} />
      </span>
      <span>
        Fathom <span className="font-normal text-muted">rebuild</span>
      </span>
    </Link>
  );
}

export function CaptureButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useCaptureMode();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-[12px] text-muted hover:border-faint hover:text-fg"
      >
        <IconRecord size={14} className="text-red-400" /> Record a call
      </button>
      {open && (
        <Modal title="Record a call (simulated)" onClose={() => setOpen(false)}>
          <div className="space-y-3 text-[13px] text-muted">
            <div role="radiogroup" aria-label="What to capture" className="space-y-2">
              {CAPTURE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === o.id}
                  onClick={() => setMode(o.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${mode === o.id ? "border-accent bg-accent/10" : "border-line hover:border-faint"}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-fg">{o.label}</span>
                    <span className="block text-[12px]">{o.blurb}</span>
                  </span>
                  {mode === o.id && <IconCheck size={16} className="text-accent" />}
                </button>
              ))}
            </div>
            <p className="text-[12px]" data-testid="capture-honesty">
              Nothing is recorded in any mode: there is no bot, desktop capture or calendar, and no audio or video is stored. The choice only decides how the sample call opens.
            </p>
            <Link
              href={mode === "transcript" ? meetingHref(TRANSCRIPT_ONLY_SAMPLE) : FLAGSHIP_HREF}
              onClick={() => setOpen(false)}
              className="inline-flex rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-2"
            >
              {mode === "transcript" ? "Open the transcript-only sample call" : "Open the 60-minute flagship meeting"}
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}

export function AppHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b border-line px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Brand />
        {title && <span className="hidden truncate text-muted sm:inline">/ {title}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full border border-line px-2 py-0.5 text-[11px] text-faint md:inline" title="No auth in this demo. You are viewing as Jordan Lee.">
          Demo · viewing as Jordan Lee
        </span>
        <CaptureButton />
        <Link href="/settings" aria-label="Settings" title="Settings" className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-fg">
          <IconGear size={16} />
        </Link>
      </div>
    </header>
  );
}
