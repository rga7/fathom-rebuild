"use client";
import Link from "next/link";
import { useState } from "react";
import { FLAGSHIP_HREF } from "@/lib/links";
import { IconLogo, IconRecord } from "./icons";
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
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-[12px] text-muted hover:border-faint hover:text-fg"
      >
        <IconRecord size={14} className="text-red-400" /> Record a call
      </button>
      {open && (
        <Modal title="Capture is simulated" onClose={() => setOpen(false)}>
          <div className="space-y-3 text-[13px] text-muted">
            <p>
              This rebuild has <span className="text-fg">no recording bot, desktop capture, or calendar connection</span>. Nothing is recorded and no
              audio or video is stored.
            </p>
            <p>
              Every meeting here is seed data: a hand-written transcript with a start time on every line, plus summaries, action items, questions and
              chapters precomputed at seed time. Playback runs on a simulated clock that drives the transcript.
            </p>
            <Link href={FLAGSHIP_HREF} onClick={() => setOpen(false)} className="inline-flex rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-2">
              Open the 60-minute flagship meeting
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
      </div>
    </header>
  );
}
