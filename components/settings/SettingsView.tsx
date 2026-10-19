"use client";
import { useRef, useState } from "react";
import { CAPTURE_OPTIONS } from "@/lib/capture";
import { useCaptureMode } from "@/lib/captureMode";
import { SCOPE_LABEL, type CaptureScope } from "@/lib/calendar";
import { useCalEvents, useCalSettings, useCalSource, useOverrides } from "@/lib/calendarStore";
import { IcsError, MAX_EVENTS, parseIcs } from "@/lib/ics";
import { isPersisted } from "@/lib/storage";
import { ME_NAME } from "@/lib/calendarText";
import { AppHeader } from "../AppHeader";
import { Toggle } from "./Toggle";

function Row({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-fg">{title}</div>
        {hint && <div className="text-[12px] text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel px-4 py-3">
      <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

const selectCls = "rounded-md border border-line bg-panel-2 px-2 py-1.5 text-fg outline-none focus:border-accent disabled:opacity-40";

function CalendarSection() {
  const [source, setSource] = useCalSource();
  const [, setOverrides] = useOverrides();
  const { events } = useCalEvents();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    setError(null);
    setNote(null);
    if (!file) return;
    try {
      const { events: parsed, skipped, truncated } = parseIcs(await file.text());
      setSource({ kind: "ics", name: file.name.slice(0, 120), events: parsed, truncated });
      setOverrides({});
      const notes = [`Imported ${parsed.length} event${parsed.length === 1 ? "" : "s"}.`];
      if (truncated) notes.push(`The file has more than ${MAX_EVENTS}; ${truncated} later events were left out.`);
      if (skipped) notes.push(`${skipped} skipped (all-day, cancelled or no start time).`);
      if (!isPersisted("cal-source")) notes.push("Browser storage is unavailable, so this import lasts only until you close the tab.");
      setNote(notes.join(" "));
    } catch (e) {
      setError(e instanceof IcsError ? e.message : "Couldn't read that file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const connectDemo = () => {
    setError(null);
    setNote(null);
    setSource({ kind: "demo" });
    setOverrides({});
  };
  const disconnect = () => {
    setSource(null);
    setOverrides({});
    setNote(null);
    setError(null);
  };

  return (
    <Section title="Calendar">
      <div className="py-2.5">
        <p className="mb-2 text-[12px] text-muted">
          Simulated. Nothing connects to Google, Outlook or any calendar service: no sign-in, no network calls. The demo calendar is generated in this browser, and an
          imported .ics file is parsed here and stored only in this browser.
        </p>
        {source ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-raised px-2 py-1" data-testid="cal-source">
              {source.kind === "demo" ? "Connected: demo calendar (generated)" : `Connected: ${source.name} · ${source.events.length} events`}
            </span>
            {source.kind === "ics" && source.truncated > 0 && <span className="text-[12px] text-amber-300">{source.truncated} events over the {MAX_EVENTS} limit were left out</span>}
            <span className="text-[12px] text-faint">{events.length} events</span>
            <button onClick={disconnect} className="ml-auto rounded-md border border-line-2 px-2.5 py-1.5 text-muted hover:border-faint hover:text-fg">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-faint">Connect calendar:</span>
            <button onClick={connectDemo} className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-2">
              Use the demo calendar
            </button>
            <label className="cursor-pointer rounded-md border border-line-2 px-3 py-1.5 text-fg hover:border-faint">
              Import an .ics file
              <input ref={fileRef} type="file" accept=".ics,text/calendar" className="sr-only" aria-label="Import an .ics file" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-red-300">
            {error}
          </p>
        )}
        {note && <p className="mt-2 text-[12px] text-muted">{note}</p>}
        <p className="mt-2 text-[11px] text-faint">Imported times without a Z suffix are read as this browser&apos;s local time. Recurring events are not expanded.</p>
      </div>
    </Section>
  );
}

export function SettingsView() {
  const [s, set] = useCalSettings();
  const [mode, setMode] = useCaptureMode();
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader title="Settings" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
          <CalendarSection />

          <Section title="General">
            <Row
              title="Auto-capture"
              hint={s.consent ? "Which upcoming meetings are captured automatically. You can override each one on the home page." : "Off until you accept the consent notice below."}
            >
              <select aria-label="Auto-capture" disabled={!s.consent} value={s.scope} onChange={(e) => set({ scope: e.target.value as CaptureScope })} className={selectCls}>
                {(Object.keys(SCOPE_LABEL) as CaptureScope[]).map((k) => (
                  <option key={k} value={k}>
                    {SCOPE_LABEL[k]}
                  </option>
                ))}
              </select>
            </Row>
            <Row title="Default capture mode" hint="Also set from the Record dialog. Nothing is recorded in any mode.">
              <select aria-label="Default capture mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className={selectCls}>
                {CAPTURE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row title="Your email" hint="Decides who counts as external and which meetings you organize.">
              <input
                aria-label="Your email"
                type="email"
                value={s.myEmail}
                onChange={(e) => set({ myEmail: e.target.value.trim() })}
                className={`${selectCls} w-56`}
              />
            </Row>
          </Section>

          <Section title="Notifications">
            <Row title="Show upcoming meeting in header" hint="A “Next: … in 12m” chip when a meeting starts within 24 hours.">
              <Toggle label="Show upcoming meeting in header" checked={s.showHeader} onChange={(v) => set({ showHeader: v })} />
            </Row>
          </Section>

          <Section title="Recording notices">
            <Row title="Email notification" hint="Would be sent to attendees when a meeting is created. Simulated: nothing is sent.">
              <Toggle label="Email notification" checked={s.emailNotice} onChange={(v) => set({ emailNotice: v })} />
            </Row>
            <Row title="Chat message" hint="Would post a notice in the meeting chat. Simulated: nothing is posted.">
              <Toggle label="Chat message" checked={s.chatNotice} onChange={(v) => set({ chatNotice: v })} />
            </Row>
            {s.chatNotice && (
              <div className="py-2.5">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-faint">Chat notice preview</div>
                <blockquote data-testid="chat-preview" className="rounded-md border-l-2 border-accent bg-panel-2 px-3 py-2 text-muted">
                  {ME_NAME} is using Fathom rebuild to record and transcribe this meeting. If you don&apos;t want to be recorded, please tell {ME_NAME.split(" ")[0]}.
                </blockquote>
              </div>
            )}
            <label className="flex cursor-pointer items-start gap-2.5 py-2.5">
              <input
                type="checkbox"
                checked={s.consent}
                onChange={(e) => set(e.target.checked ? { consent: true } : { consent: false, scope: "none" })}
                className="mt-0.5 h-4 w-4 accent-[#4f8cff]"
              />
              <span>
                I understand I&apos;m responsible for collecting attendee consent for the recording and transcription, in accordance with applicable laws.
                <span className="block text-[12px] text-faint">Auto-capture can&apos;t be turned on until this is ticked. Nothing is actually recorded in this demo.</span>
              </span>
            </label>
          </Section>
        </div>
      </div>
    </div>
  );
}
