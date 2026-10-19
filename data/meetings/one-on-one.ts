import type { Meeting } from "../types";
import { oneOnOneAnchors as A, oneOnOneLines } from "../generated/one-on-one.ts";

export const oneOnOne: Meeting = {
  id: "jordan-maya-1-1",
  shareToken: "1FsgzXvrOPx8fJU7dnNZ",
  title: "Jordan / Maya 1:1",
  kind: "one_on_one",
  startedAt: "2026-10-13T17:00:00Z",
  hostId: "maya",
  participants: ["maya", "jordan"],
  snippet:
    "Maya pushed Jordan to take a clear position (narrow offline first) in the planning doc instead of staying neutral. They traded feedback: Maya will give Priya room in reviews; Jordan will route deal-specific asks from Marcus through triage.",
  lines: oneOnOneLines,
  defaultTemplate: "one_on_one",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Weekly 1:1 covering the Q1 planning doc, the PM hire, the Orchard escalation, and mutual feedback." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Planning doc", text: "Maya: a neutral doc invites a fight. Jordan will recommend a narrow offline-first scope and state the 14 engineer-month capacity.", cite: A.cap14 },
          { lead: "PM hire", text: "Domain experience is the bigger gap than polish; leaning toward the candidate from the logistics startup.", cite: A.ch_hiring },
          { lead: "Orchard", text: "The iOS draft-loss fix (~2 weeks) may move into the next sprint; Maya to confirm with Dev.", cite: A.ai_confirm_dev },
          { lead: "Feedback", text: "Jordan told Maya her early architecture comments silenced Priya in a design review; Maya told Jordan they say yes to Marcus's small deal requests too fast.", cite: A.ch_feedback },
        ],
      },
      {
        heading: "Next steps",
        bullets: [
          { text: "Jordan revises the planning doc and sends it to Maya first.", cite: A.ai_revise_doc },
          { text: "Jordan books Maya with the PM candidate Thursday at 3.", cite: A.ai_book_chat },
        ],
      },
    ],
    one_on_one: [
      { heading: "Check-in", body: "Jordan is stretched across planning, the Orchard escalation, and hiring. Maya flagged that late-night doc comments set an unintended norm; Jordan will schedule-send.", bullets: [{ text: "Jordan: \"A bit stretched.\"", cite: A.ch_checkin }] },
      {
        heading: "Wins",
        bullets: [
          { text: "Sofia's research gave Jordan conviction on a narrower offline scope.", cite: A.cap14 },
          { text: "Jordan feels less like they're \"faking it\" six months into the role.", cite: A.ch_growth },
        ],
      },
      {
        heading: "Blockers",
        bullets: [
          { text: "Orchard escalation lacks an engineering owner.", cite: A.ch_orchard },
          { text: "Jordan is writing every spec personally; the PM hire is the unblock.", cite: A.ch_growth },
        ],
      },
      {
        heading: "Feedback",
        bullets: [
          { lead: "To Maya", text: "Jumping in early with architecture concerns during Priya's design review took the air out of the room.", cite: A.ch_feedback },
          { lead: "To Jordan", text: "Saying yes to Marcus's small deal-specific requests too fast makes engineering feel the roadmap keeps moving.", cite: A.ai_triage },
        ],
      },
      {
        heading: "Career & growth",
        bullets: [{ text: "Maya: hiring the PM matters more than the planning doc.", cite: A.ch_growth }],
      },
      {
        heading: "Follow-ups",
        bullets: [
          { text: "Maya talks to Priya and holds concerns until presenters finish.", cite: A.ai_talk_priya },
          { text: "Jordan routes deal-specific requests through weekly triage starting next week.", cite: A.ai_triage },
        ],
      },
    ],
    standup: [
      { heading: "Format note", body: "1:1 rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Jordan", text: "Next: revise planning doc, book candidate chat, set up deal-request triage. Blocker: too much spec writing.", cite: A.ai_revise_doc },
          { lead: "Maya", text: "Next: confirm Dev's time for the Orchard fix by Wednesday; talk to Priya.", cite: A.ai_confirm_dev },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Internal 1:1 with no sales context. MEDDPICC fields were not discussed." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "Not discussed." },
          { lead: "Economic buyer", text: "Not discussed." },
          { lead: "Decision criteria", text: "Not discussed." },
          { lead: "Decision process", text: "Not discussed." },
          { lead: "Paper process", text: "Not discussed." },
          { lead: "Identify pain", text: "Internal only: Orchard escalation (photo uploads, iOS drafts).", cite: A.ch_orchard },
          { lead: "Champion", text: "Not discussed." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Revise the Q1 planning doc with a clear recommendation and the 14 engineer-month number; send to Maya first", owner: "jordan", due: "2026-10-14", sourceLineId: A.ai_revise_doc },
    { id: "a2", text: "Confirm with Dev whether the iOS draft fix fits the next sprint", owner: "maya", due: "2026-10-14", sourceLineId: A.ai_confirm_dev },
    { id: "a3", text: "Book Maya for a 30-minute chat with the PM finalist (Thu 3pm)", owner: "jordan", due: "2026-10-15", sourceLineId: A.ai_book_chat },
    { id: "a4", text: "Talk to Priya about the design review", owner: "maya", due: "2026-10-16", sourceLineId: A.ai_talk_priya },
    { id: "a5", text: "Tell Marcus deal-specific requests go through weekly triage", owner: "jordan", due: "2026-10-19", sourceLineId: A.ai_triage },
  ],
  questions: [
    { id: "q1", lineId: "L019", answered: true },
    { id: "q2", lineId: "L028", answered: true },
    { id: "q3", lineId: "L031", answered: true },
    { id: "q4", lineId: "L060", answered: true },
    { id: "q5", lineId: "L062", answered: true },
  ],
  chapters: [
    { id: "c1", title: "Check-in", startLineId: A.ch_checkin },
    { id: "c2", title: "Planning doc", startLineId: A.ch_planning },
    { id: "c3", title: "PM hire", startLineId: A.ch_hiring },
    { id: "c4", title: "Orchard escalation", startLineId: A.ch_orchard },
    { id: "c5", title: "Feedback", startLineId: A.ch_feedback },
    { id: "c6", title: "Growth", startLineId: A.ch_growth },
  ],
  decisions: [{ text: "Deal-specific requests from sales go through the weekly triage starting next week.", lineId: A.ai_triage }],
  followUpEmail: {
    subject: "1:1 follow-ups",
    body: `Hi Maya,

Thanks for the honest read on the planning doc. Follow-ups from today:

- I'll revise the doc with a clear recommendation (narrow offline first) and the 14 engineer-month number, and send it to you before it goes wide.
- I've booked you with the PM finalist Thursday at 3.
- You'll confirm by Wednesday whether Dev can take the iOS draft fix next sprint.
- Starting next week, deal-specific requests from Marcus go through weekly triage.

Same time next week.
Jordan`,
  },
  suggestedPrompts: ["What feedback did Maya give Jordan?", "What did they decide about the PM hire?", "What's happening with Orchard?"],
  highlights: [
    { id: "hl-1on1-feedback", type: "feedback", title: "Neutral docs invite a fight", startLineId: "L016", endLineId: "L018" },
    { id: "hl-1on1-insight", type: "insight", title: "Polish you can coach; domain takes years", startLineId: "L030", endLineId: "L030" },
  ],
  scratchpad: `1:1 notes

- Planning doc: take a position.
- @Jordan send revised doc to Maya by Wednesday
- PM finalist: domain > polish.`,
  vocabSuggestions: [],
};
