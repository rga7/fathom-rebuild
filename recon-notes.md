# Fathom recon notes

Used Fathom's free plan on a Mac (desktop app, bot-free capture). Screenshots are in `/recon` (local only, not committed). Findings below are from what I actually used or saw. Anything I did not verify is listed at the end.

## What I tested
- Onboarding: permissions, capture mode (Video & Audio / Audio / Transcript Only), recording notices and consent.
- Two real recordings: a 2-minute transcript-only solo call, and a ~2-minute call with spoken action items.
- Meeting page: Summary, Action Items, Transcript, Scratchpad tabs; summary templates; Ask Fathom; Share; shared link in an incognito window.
- The built-in "Fathom Demo" sample call (video + 2 speakers).

## Product shape
- Meetings list grouped by date with summary snippet, duration, avatars. Ask Fathom is a permanent right-hand panel with a scope picker (This Call / My Calls / Team Calls / All Calls) and meeting-aware suggested prompts.
- Meeting page: Summary / Action Items (count badge) / Transcript / Scratchpad. Video player pinned top-right above Ask Fathom.
- Transcript: grouped speaker turns with avatar, name, one timestamp per turn, in-transcript search, copy button. Active text highlights during playback.
- Summary: Live then Enhanced, which uses scratchpad notes plus transcript. Template menu is mostly sales frameworks (Sales, Sandler, SPICED, MEDDPICC, BANT).
- Ask Fathom answers carry clickable citation chips like "... @ 1:17".
- Share: add people/emails or "Anyone with the link can view". The signed-out page shows Summary / Transcript / Ask Fathom, a "Get your own free AI Notetaker" banner, copy-summary, copy-for (Asana, Google Docs, Gmail, Todoist, Word) and AI-generated follow-up email. Scratchpad is not shown.

## Highlights, clips, questions (seen in Fathom's built-in sample recording)
Source: the 8:18 sample call (screens 26-33). This is the older Zoom-app UI, not the current desktop app I used, so I treat it as "seen", not "tested live".
- **Live panel during a call:** one-tap buttons for Action Item, Insight, Positive, Feedback, Objection, Tech Question. A highlight shows a running timer and an optional note, and auto-ends when you speak for 4+ seconds.
- **After the call:** highlights list with duration (e.g. 1m, 10s), quoted text, play button, rename, copy link, delete. Highlight ranges show as blue segments on the scrubber and as a highlighted block in the transcript.
- **Retroactive highlights:** hovering a transcript line shows a "+" in the gutter with the same types plus Bookmark and Action Item.
- **Questions panel:** auto-detected questions with speaker avatar, timestamp, and a play button.
- **Action items and questions have play buttons** that jump the video to the moment.
- **Clip sharing:** each highlight has its own link (/share/h/...), opens signed out; Slack integration posts an insight card with a clip link.
- **Player:** speed control (1.1x), scrubber, 10-second back/forward, star rating on the call, Copy Summary for Notion, Copy for (Google Docs, Gmail, Todoist, Asana).
- **Extras I will skip:** HubSpot sync, points counter, Slack/Notion integrations.

## Gaps I found
1. Action items have no owner. "Paul" and "Emily" are named aloud and in the summary, but both items show a blank Assign control.
2. Timestamps disagree: both action items say 2:19, while the Ask Fathom citation for the same moment says 2:29.
3. Transcription errors ("trolling window-forward", "validation cardinals", "cross-retention") flow into the transcript with no way to correct them or add custom vocabulary. The summary silently fixes some.
4. Transcript timestamps exist only at the start of each speaker turn, so there is nothing finer to click.
5. Transcript search counter shows "0/1" after a match instead of "1/1".
6. Summary templates are sales-heavy; few for 1:1s, standups, interviews.
7. Transcript-only mode saves no audio or video, so no playback.

## What I copied, skipped, and chose to improve
**Copy:** tab layout, always-on Ask panel with scope picker, citation chips, signed-out share page with a growth banner, scratchpad that feeds the summary, meeting-aware suggested prompts.
**Stub (and say so):** recording bot, calendar, integrations ("Send to..."), consent flow. Capture is simulated; playback uses a simulated clock.
**Beat the original:** line-accurate click-to-seek, per-line active highlight, every Ask claim cites a moment that seeks the player, action items with owner and due date linked to the source line, correct search counter, chapters and talk-time for long calls, more template types, transcript correction.
**Left out:** auth, billing, real integrations, teams/workspaces, native apps.

## Not verified (do not claim in the walkthrough)
- Whether clicking a transcript line itself seeks the video in the original (the play buttons on action items and questions clearly seek).
- Highlights and clips were seen only in the sample recording's older UI; I did not create one myself in the current app.
- Behavior on an 8-person, 1-hour call (no such recording was made).
- Fathom's current plan limits; a third-party video description claimed five AI summaries per month on the free plan.
