# Fathom rebuild

A rebuild of a Fathom-style AI meeting notetaker: meetings list, meeting page with a simulated player, a transcript where every line is clickable, summaries in four templates, action items, questions, highlights and clips, Ask (search across calls), and signed-out share pages.

It is an unofficial study project, not affiliated with Fathom. Every person, company and call in it is fictional seed data.

**Live:** https://fathom-rebuild-seven.vercel.app. It opens without a login; you view as the fixed persona "Jordan Lee". A signed-out share page: https://fathom-rebuild-seven.vercel.app/share/TF5FvWmPPxSGTH52zX4V and a clip link: https://fathom-rebuild-seven.vercel.app/share/h/hl-flag-insight

## What is real and what is stubbed

| Area | Status |
| --- | --- |
| Recording, bot, desktop capture, calendar | **Stubbed.** Nothing is recorded in any mode. "Record a call" opens a dialog with the three capture modes (Video & Audio, Audio default, Transcript only; remembered in `localStorage`) and says so. The mode only decides which seeded sample call it opens. |
| Playback | **Simulated.** A `requestAnimationFrame` clock (play/pause, 1x / 1.25x / 1.5x / 2x, scrubber, 10s back/forward) drives the transcript. There is no audio or video. The stage shows who is speaking and the current line as a caption. **Optional spoken playback** (off by default) reads the active line aloud with the browser's `speechSynthesis` voices; see below. |
| Summaries, action items, questions, chapters, follow-up emails | **Precomputed at seed time** (hand-written in `data/meetings/*.ts`), not generated live. |
| Ask | **Extractive retrieval** over the seeded transcripts (BM25 in `lib/ask.ts`). No LLM call at runtime. Answers quote transcript lines; some question shapes are answered from seed data (see below). |
| Integrations ("Send to…", "Copy for…") | **Stubs** that format text for Notion, Docs, Slack, Gmail, Asana or Todoist and copy it to the clipboard. The toast says so. |
| Per-viewer state | **Real, but local.** Highlights, scratchpad, transcript edits, custom vocabulary, checkboxes and template choice live in `localStorage`, scoped to one browser. All access is wrapped in try/catch, and the app falls back to in-memory state when storage is blocked. |
| Auth, billing, teams, native apps | Not built (out of scope). |

## Running it

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Seed data tools:

```bash
npm run seed:build   # data/transcripts/*.txt  ->  data/generated/*.ts (ids + start/end times)
npm run seed:check   # validates every reference; add -- --print to read each cited line
node --experimental-strip-types scripts/try-prompts.ts -v       # run every suggested Ask prompt
node --experimental-strip-types scripts/try-ask.ts "question" all   # ask from the CLI
```

There is no database, API key or `.env`. Every page except viewer-made clip links is prerendered at build time.

## How the seed data works

- **10 meetings over six weeks** (Sep 10 to Oct 16, 2026): Q1 planning (flagship), 1:1, standup, sales discovery, customer check-in, candidate interview, design review, a solo technical walkthrough, a metrics review, and a customer pilot kickoff.
- **Flagship** (`/meetings/q1-planning-atlas-2`): 8 named participants, 59:08, 518 lines, 6 chapters. It has interruptions (lines that end in "—" are cut off by the next speaker), a Marcus vs Maya disagreement about SSO and offline first, two explicit decisions, four questions nobody answers, and speech-to-text errors ("sock two", "samel", "see are DTs", "post gress", "octa"). The summaries quietly correct them to SOC 2, SAML, CRDTs, Postgres and Okta.
- **Transcripts are authored as plain text** (`speaker: text {#anchor}`) and compiled by `scripts/build-transcripts.mjs`. The script gives every line an id plus start and end times from word count, scaled to the target length. Action items, questions, chapters, decisions, highlights and summary citations reference **lines**, not timestamps, so a displayed time is always the cited line's start. That makes the "2:19 vs 2:29" mismatch from the original impossible.
- **Derived, not stored:** duration (last line's end) and talk time per speaker (sum of each speaker's line durations) are computed in `lib/derive.ts`.

## Features, by build step

1. **Meetings list:** grouped by date, with duration badge, summary snippet, avatars and action-item count. Search covers titles, snippets, people, action items and summary bullets (`/` focuses it). Filter by participant. Ask in the right column.
2. **Meeting page:** tabs for Summary, Action Items (count), Transcript, Highlights, Questions and Scratchpad. The player is pinned top-right above an always-visible Ask panel.
3. **Transcript:** speaker turns with avatar, name and a turn timestamp. Every line keeps its own start time (shown on hover), and clicking any line seeks there. The active line highlights, and auto-scroll follows it until you scroll yourself ("Resume auto-scroll"). Search counts every occurrence and reads **1 of N** after a match, not "0/1". Enter and Shift+Enter step through matches with wrap-around.
4. **Summary:** a template switcher (General, 1:1, Standup, Sales/MEDDPICC; choice remembered per meeting) and **Copy summary** (Markdown with `[mm:ss]`). Every sourced bullet has a seek chip. Non-sales calls say "Not discussed" rather than inventing MEDDPICC fields.
5. **Action items:** owner, due date, a persistent checkbox, and a play chip that jumps to the exact line the item was assigned on, quoted underneath.
6. **Ask:** scope This call / My calls / All calls, and three meeting-aware suggested prompts per call. Every claim carries a `Topic @ mm:ss` chip. In the current call it seeks the player; for another call it opens that meeting at `?t=` (tenths of a second, so it lands on the right line).
   **6b. Questions:** detected questions with speaker, timestamp, play, and an answered/unanswered status and filter.
7. **Share:** `/share/[token]` works signed out, with Summary / Transcript / Ask tabs, a "Get your own AI notetaker" banner, Copy summary, Copy for…, a Follow-up email dialog and read-only action items. The scratchpad is never rendered there. The meeting page has Share (with an explanation of what viewers see) and a one-click copy-link button.
8. **Highlights:** seven types (Action item, Insight, Positive, Feedback, Objection, Tech question, Bookmark). Create one with the **+** in the transcript gutter, or press **H** during playback for a timed highlight (1–7 pick or change the type; there's an optional note; H, Enter or End saves, Esc cancels). Highlights show as coloured ranges on the scrubber and tint the transcript. The Highlights tab lists type, start, duration, quoted text, play-the-range, rename, copy link and delete, with a filter by type. Each highlight has a signed-out link, `/share/h/[id]`, that opens the shared page in clip mode at that range.
9. **Flagship extras:** chapters (list, scrubber gaps, hover titles, current chapter on the stage), talk time per speaker, and a multi-select speaker filter on the transcript. Search counts follow the filter.
10. **Stretch:** edit any transcript line (with an "edited · revert" tag), custom vocabulary (heard as → should be, with one-click suggestions from each call's seed-time mis-hearings and a dotted underline on fixed words), and scratchpad **@mentions** that become action items with the right owner and a parsed due date ("by Friday", "by Oct 30"), with an @ autocomplete.

**Spoken playback (optional):** a speaker icon next to the speed button turns it on, and a volume slider appears beside it. These are your browser's built-in text-to-speech voices, not the recorded meeting audio. Each participant gets a different English voice (when there are more speakers than voices, voices repeat with a lower pitch). The line that is playing is spoken; speech is cancelled on pause, seek and speed change, and a line that runs long is cut off when the next one starts. The simulated clock never waits for speech, so the two can drift. If `speechSynthesis` is missing, the controls are not rendered. The on/volume choice is kept in `localStorage`. Voice names and quality differ per browser and OS, and Safari only starts speech after a click or key press.

**Capture modes:** Video & Audio only adds "Video & Audio" to the player's "Simulated" label; Audio is the same player. A **transcript-only** call (`capture: "transcript"` in the seed data; the solo sync-engine walkthrough is the one seeded example) has no player or scrubber and shows "Transcript only: no recording saved" instead. Time chips are shown but don't seek (tooltip explains), transcript lines and chapters don't seek, Space/arrows/H do nothing, highlight play and clip links are hidden or disabled, and its `/share/h/…` clip links 404. Summary, action items, questions, transcript, scratchpad and Ask still work.

**Keyboard:** Space play/pause · ←/→ 10s · `/` search · H highlight · 1–7 highlight type · Esc cancel · `?` shortcuts list. Shortcuts are ignored while you type in a field.

## Design decisions worth knowing

- **Ask is honest about being extractive.** Ranking is BM25 over lines, plus a little neighbour context and a boost for people named in the question. A matched question also pulls in the reply. Questions about action items, open questions, decisions, summaries and follow-up emails are answered from the seed data, with line citations. When a hand-written summary bullet strongly matches the question, it leads the answer, labelled "From the summary". It can't answer in words nobody said: "Who is the economic buyer?" finds nothing, while "Who signs off on the budget?" works.
- **Clip links for your own highlights carry the clip.** Highlights you create exist only in your browser, so their share id is `c` + base64url of `{meeting token, type, start, end, title}`, decoded server-side. Seeded highlights use short, prerendered ids. The trade-off: the title is visible in the URL.
- **Shared pages are read-only and show seed content.** Your transcript edits, vocabulary and created highlights don't travel, except the one highlight a clip link encodes.
- **Dates render in a fixed timezone** (America/Los_Angeles) so server and client agree. Group headings use absolute dates, so the deployed build never shows a stale "Today".

## Where this differs from the recon notes

- The original's Ask scope includes **Team Calls**. It's left out, because teams are out of scope.
- The original **auto-ends a live highlight when you speak for 4+ seconds**. There is no microphone here, so highlights end on H, Enter or End.
- The original's **Enhanced summary folds in scratchpad notes**. Here summaries are precomputed, so the scratchpad feeds action items (via @mentions) but doesn't rewrite the summary.
- The original's template menu is Live/Enhanced plus five sales frameworks. This build has the four templates the brief asked for (General, 1:1, Standup, MEDDPICC).
- Highlights and Questions are **tabs**, because the right column is the player plus Ask. In the original sample they sat in a right-hand rail.
- The original shows action items on the shared page, so this one does too.

## Known limitations

- Only the flagship is long. The other nine calls are 3–8 minutes of transcript, so their derived durations are short.
- Per-viewer state doesn't sync across devices or people. There's no backend by design.
- No automated test suite is committed. Each step was checked in a real browser (Playwright, run from outside the repo), and `npm run seed:check` guards the data.

## What I would build next

1. A real capture path: upload an audio file, run speech-to-text with word timings, and keep the same line-anchored data model.
2. LLM summaries and an Ask that composes an answer from the retrieved lines while keeping one citation per claim and refusing to answer without one.
3. A small backend (accounts, Postgres) so highlights, edits, vocabulary and share settings sync, plus per-link permissions and expiry.
4. Vocabulary applied at transcription time, and corrections that feed back into summaries and search.
5. Word-level timestamps for sub-line seeking, and highlight ranges created by selecting text.
6. Committed end-to-end tests (Playwright) for the flows verified by hand here: share signed out, clip links, search counter, action-item timestamps.

## Project layout

```
app/                     routes: /, /meetings/[id], /share/[token], /share/h/[id]
components/              UI (player/, meeting/, AskPanel, Menu, Modal, Toaster…)
data/transcripts/*.txt   hand-authored transcripts (source of truth)
data/generated/*.ts      compiled lines with ids and times (do not edit)
data/meetings/*.ts       precomputed summaries, items, questions, chapters, emails, highlights
lib/                     ask (retrieval), derive (duration/talk time), highlights, storage, vocab, scratchpad
scripts/                 transcript compiler, seed checker, Ask CLI
```
