"use client";
import type { Meeting } from "@/data/types";
import { Menu } from "../Menu";
import { useCopy } from "../Toaster";
import { IconGlobe, IconLink } from "../icons";

export function shareUrl(path: string) {
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

export function ShareControls({ meeting }: { meeting: Meeting }) {
  const copy = useCopy();
  const path = `/share/${meeting.shareToken}`;
  return (
    <div className="flex items-center overflow-hidden rounded-md bg-accent text-white">
      <Menu
        label="Share"
        align="right"
        panelClassName="w-80 p-3"
        button={() => <span className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium hover:bg-accent-2">Share</span>}
      >
        {(close) => (
          <div className="space-y-3 text-[12px] text-muted">
            <div className="flex items-start gap-2">
              <IconGlobe size={16} className="mt-0.5 shrink-0 text-accent" />
              <p>
                <span className="font-medium text-fg">Anyone with the link can view.</span> No sign-in needed. Viewers see the summary, transcript, action
                items and Ask. Your scratchpad is never shared.
              </p>
            </div>
            <div className="flex gap-2">
              <input readOnly value={shareUrl(path)} className="min-w-0 flex-1 rounded-md border border-line bg-panel-2 px-2 py-1 text-[12px] text-fg" onFocus={(e) => e.target.select()} />
              <button
                onClick={() => (copy(shareUrl(path), "Share link copied"), close())}
                className="rounded-md bg-accent px-2.5 py-1 font-medium text-white hover:bg-accent-2"
              >
                Copy
              </button>
            </div>
            <a href={path} target="_blank" rel="noreferrer" className="block text-accent hover:underline">
              Open shared page ↗
            </a>
          </div>
        )}
      </Menu>
      <button onClick={() => copy(shareUrl(path), "Share link copied")} aria-label="Copy share link" title="Copy share link" className="border-l border-white/25 px-2 py-1.5 hover:bg-accent-2">
        <IconLink size={14} />
      </button>
    </div>
  );
}
