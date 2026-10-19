"use client";
import { useState } from "react";
import type { Meeting } from "@/data/types";
import { Modal } from "../Modal";
import { useCopy } from "../Toaster";
import { IconMail } from "../icons";

export function FollowUpEmailButton({ meeting, className = "" }: { meeting: Meeting; className?: string }) {
  const [open, setOpen] = useState(false);
  const copy = useCopy();
  const { subject, body } = meeting.followUpEmail;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-muted hover:border-faint hover:text-fg ${className}`}
      >
        <IconMail size={14} /> <span className="hidden sm:inline">Follow-up email</span><span className="sm:hidden">Email</span>
      </button>
      {open && (
        <Modal title="Follow-up email" onClose={() => setOpen(false)} wide>
          <p className="mb-3 text-[12px] text-faint">Written at seed time from the summary and action items. Nothing is sent from here.</p>
          <div className="rounded-lg border border-line bg-panel-2 p-3">
            <div className="mb-2 border-b border-line pb-2 text-[13px]">
              <span className="text-muted">Subject: </span>
              {subject}
            </div>
            <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap font-sans text-[13px] leading-5 text-zinc-300">{body}</pre>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <a
              href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] text-muted hover:text-fg"
            >
              Open in email app
            </a>
            <button onClick={() => copy(`Subject: ${subject}\n\n${body}`, "Email copied")} className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent-2">
              Copy email
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
