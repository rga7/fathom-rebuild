"use client";
import { useRef, useState } from "react";
import { CAPTURE_OPTIONS } from "@/lib/capture";
import { useCaptureMode } from "@/lib/captureMode";
import { MAX_EVENTS, SCOPE_LABEL, type CaptureScope } from "@/lib/calendar";
import { DEMO_HIDDEN_KEY, FEED_URL_KEY, useCalEvents, useCalSettings, useCalSource, useOverrides } from "@/lib/calendarStore";
import { SYNC_ERROR_TEXT, SyncFailure, connectFeed, disconnectFeed, syncNow, useSyncState, type SyncError } from "@/lib/calendarSync";
import { isPersisted, writeStored } from "@/lib/storage";
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

const clock = (ms: number) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(ms);

function FeedConnect() {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SyncError | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const { persisted } = await connectFeed(url);
      setUrl("");
      if (!persisted) setNote("Browser storage is unavailable, so the link lasts only until you close the tab.");
    } catch (e) {
      setError(e instanceof SyncFailure ? e.code : "upstream_error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-line bg-panel-2 p-3" data-testid="feed-connect">
      <h3 className="font-medium text-fg">Connect with a private calendar link</h3>
      <details className="mt-1 text-[12px] text-muted">
        <summary className="cursor-pointer text-accent">How to get the link</summary>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            <span className="text-fg">Google Calendar:</span> Settings, pick the calendar, Integrate calendar, then copy the <em>Secret address in iCal format</em>.
          </li>
          <li>
            <span className="text-fg">Outlook:</span> Settings, Calendar, Shared calendars, Publish a calendar, then copy the ICS link.
          </li>
          <li>
            <span className="text-fg">Apple Calendar (iCloud):</span> share the calendar as a Public Calendar and copy its webcal:// link.
          </li>
        </ul>
        <p className="mt-1">Accepted hosts: calendar.google.com, outlook.office365.com, outlook.live.com and *.icloud.com.</p>
      </details>
      <p className="mt-2 rounded-md bg-amber-400/10 px-2.5 py-1.5 text-[12px] text-amber-200" data-testid="feed-warning">
        This link gives read access to your whole calendar, so treat it like a password. It is stored only in this browser and sent to this app&apos;s server on each sync;
        the server uses it to fetch your calendar and keeps nothing (it isn&apos;t logged or stored). You can reset the link in your calendar at any time.
      </p>
      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim() && !busy) void connect();
        }}
      >
        <input
          aria-label="Private calendar link"
          type={show ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… or webcal://…"
          className={`${selectCls} min-w-[240px] flex-1`}
        />
        <label className="flex items-center gap-1 text-[12px] text-muted">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show
        </label>
        <button type="submit" disabled={!url.trim() || busy} className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-2 disabled:opacity-40">
          {busy ? "Connecting…" : "Connect"}
        </button>
      </form>
      {error && (
        <p role="alert" data-testid="feed-error" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-red-300">
          {SYNC_ERROR_TEXT[error]}
        </p>
      )}
      {note && <p className="mt-2 text-[12px] text-muted">{note}</p>}
    </div>
  );
}

function CalendarSection() {
  const [, setSource] = useCalSource();
  const [, setOverrides] = useOverrides();
  // The effective source: with nothing stored this is the default demo calendar.
  const { source, events } = useCalEvents();
  const sync = useSyncState();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    setError(null);
    setNote(null);
    if (!file) return;
    try {
      // ical.js is only loaded when someone imports a file.
      const { parseIcs, IcsError } = await import("@/lib/ics");
      try {
        const { events: parsed, skipped, truncated } = parseIcs(await file.text());
        writeStored(FEED_URL_KEY, null);
        setSource({ kind: "ics", name: file.name.slice(0, 120), events: parsed, truncated });
        setOverrides({});
        const notes = [`Imported ${parsed.length} event${parsed.length === 1 ? "" : "s"} for the next 30 days.`];
        if (truncated) notes.push(`The file has more than ${MAX_EVENTS}; ${truncated} later events were left out.`);
        if (skipped) notes.push(`${skipped} skipped (all-day or cancelled).`);
        if (!isPersisted("cal-source")) notes.push("Browser storage is unavailable, so this import lasts only until you close the tab.");
        setNote(notes.join(" "));
      } catch (e) {
        setError(e instanceof IcsError ? e.message : "Couldn't read that file.");
      }
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const connectDemo = () => {
    setError(null);
    setNote(null);
    writeStored(FEED_URL_KEY, null);
    writeStored(DEMO_HIDDEN_KEY, null);
    setSource({ kind: "demo" });
    setOverrides({});
  };
  const disconnect = () => {
    disconnectFeed();
    setNote(null);
    setError(null);
  };

  return (
    <Section title="Calendar">
      <div className="py-2.5">
        <p className="mb-2 text-[12px] text-muted">
          Calendar events are real if you connect a private link or import a file, but capture is still simulated: nothing joins your meetings and nothing is recorded.
          There is no sign-in with Google or Microsoft.
        </p>
        {source ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-raised px-2 py-1" data-testid="cal-source">
                {source.kind === "demo"
                  ? "Connected: demo calendar (generated)"
                  : source.kind === "feed"
                    ? `Connected: private calendar link (${source.host || "unknown host"}) · ${source.events.length} events in the next 7 days`
                    : `Connected: ${source.name} · ${source.events.length} events`}
              </span>
              {(source.kind === "ics" || source.kind === "feed") && source.truncated > 0 && (
                <span className="text-[12px] text-amber-300">{source.truncated} events over the {MAX_EVENTS} limit were left out</span>
              )}
              {source.kind === "demo" && <span className="text-[12px] text-faint">{events.length} events</span>}
              <button onClick={disconnect} className="ml-auto rounded-md border border-line-2 px-2.5 py-1.5 text-muted hover:border-faint hover:text-fg">
                Disconnect
              </button>
            </div>
            {source.kind === "feed" && (
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
                <span data-testid="last-synced">{sync.syncing ? "Syncing…" : `Last synced ${clock(source.syncedAt)}`}</span>
                <button onClick={() => void syncNow({ force: true })} disabled={sync.syncing} className="rounded-md border border-line-2 px-2 py-1 text-fg hover:border-faint disabled:opacity-40">
                  Sync now
                </button>
                <span className="text-faint">Also syncs on load and every 10 minutes while this tab is open.</span>
              </div>
            )}
            {source.kind === "feed" && sync.error && (
              <p role="alert" data-testid="sync-error" className="rounded-md bg-red-500/10 px-2.5 py-1.5 text-red-300">
                {SYNC_ERROR_TEXT[sync.error]} Showing events from the last successful sync.
              </p>
            )}
            {source.kind === "feed" && events.length === 0 && !sync.error && <p className="text-[12px] text-muted">No meetings in the next 7 days.</p>}
          </div>
        ) : null}
        {(!source || source.kind === "demo") && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-faint">{source ? "Use your own instead:" : "Connect calendar:"}</span>
            {!source && (
              <button onClick={connectDemo} className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-2">
                Use the demo calendar
              </button>
            )}
            <label className="cursor-pointer rounded-md border border-line-2 px-3 py-1.5 text-fg hover:border-faint">
              Import an .ics file
              <input ref={fileRef} type="file" accept=".ics,text/calendar" className="sr-only" aria-label="Import an .ics file" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        )}
        {(!source || source.kind === "demo") && <FeedConnect />}
        {error && (
          <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-red-300">
            {error}
          </p>
        )}
        {note && <p className="mt-2 text-[12px] text-muted">{note}</p>}
        <p className="mt-2 text-[11px] text-faint">Times are shown in this browser&apos;s time zone. Imported files are read once; private links re-sync.</p>
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
