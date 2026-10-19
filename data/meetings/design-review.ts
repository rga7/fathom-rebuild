import type { Meeting } from "../types";
import { designReviewAnchors as A, designReviewLines } from "../generated/design-review.ts";

export const designReview: Meeting = {
  id: "offline-design-review",
  shareToken: "gCv7268oLsdbPWtKl3Wd",
  title: "Offline mode design review",
  kind: "design_review",
  startedAt: "2026-10-07T21:00:00Z",
  hostId: "sofia",
  participants: ["sofia", "priya", "dev", "jordan"],
  snippet:
    "Reviewed the three-state status pill and the upload queue. Errors use plain language; dispatcher copy changes from \"last seen\" to \"last checked in\". Conflicts are last-write-wins with an office conflict list. A clickable tablet prototype is ~2 weeks out.",
  lines: designReviewLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Review the offline status indicator and upload queue designs." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Status pill", text: "Three states: saved on device, waiting for signal, synced. Technicians care about \"safe\" and \"reached the office\" separately.", cite: A.pill_states },
          { lead: "Queue", text: "Items grouped by job with thumbnail, size, wait time; retry disabled while running to avoid duplicates.", cite: A.ch_queue },
          { lead: "Errors", text: "Plain-language errors tested far better than codes.", cite: A.plain_errors },
          { lead: "Conflicts", text: "Last-write-wins with a conflict list for dispatchers; v1 can be ugly.", cite: A.ch_conflicts },
        ],
      },
      { heading: "Open questions", bullets: [{ text: "Should technicians ever be told about a conflict?", cite: A.q_tech_conflict }] },
      {
        heading: "Next steps",
        bullets: [
          { text: "Priya changes dispatcher copy to \"last checked in\".", cite: A.ai_copy },
          { text: "Dev adds a fake network toggle to the dev build by Friday.", cite: A.ai_toggle },
          { text: "Sofia writes up open questions.", cite: A.ai_writeup },
        ],
      },
    ],
    one_on_one: [
      { heading: "Format note", body: "Design review rendered as 1:1 sections." },
      { heading: "Feedback", bullets: [{ text: "Dev: \"last seen\" overclaims; \"last checked in\" is more honest.", cite: A.ai_copy }] },
      { heading: "Follow-ups", bullets: [{ text: "Network toggle; open-questions write-up.", cite: A.ai_toggle }] },
    ],
    standup: [
      { heading: "Format note", body: "Design review rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Priya", text: "Done: queue screens nearly complete. Next: clickable prototype (~2 weeks), copy fix.", cite: A.ai_copy },
          { lead: "Dev", text: "Next: fake network toggle by Friday.", cite: A.ai_toggle },
          { lead: "Sofia", text: "Next: book technician sessions; write up open questions.", cite: A.ai_writeup },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Internal design review with no sales context. MEDDPICC fields were not discussed." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "Not discussed." },
          { lead: "Economic buyer", text: "Not discussed." },
          { lead: "Decision criteria", text: "Not discussed." },
          { lead: "Decision process", text: "Not discussed." },
          { lead: "Paper process", text: "Not discussed." },
          { lead: "Identify pain", text: "Technicians lose trust when uploads fail silently.", cite: A.plain_errors },
          { lead: "Champion", text: "Not discussed." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Change dispatcher hover copy from \"last seen\" to \"last checked in\"", owner: "priya", due: "2026-10-09", sourceLineId: A.ai_copy },
    { id: "a2", text: "Add a fake network toggle to the dev build", owner: "dev", due: "2026-10-09", sourceLineId: A.ai_toggle },
    { id: "a3", text: "Write up and share the open questions, including technician-facing conflicts", owner: "sofia", due: "2026-10-12", sourceLineId: A.ai_writeup },
  ],
  questions: [
    { id: "q1", lineId: "L007", answered: true },
    { id: "q2", lineId: "L015", answered: true },
    { id: "q3", lineId: "L027", answered: true },
    { id: "q4", lineId: "L033", answered: false },
    { id: "q5", lineId: "L037", answered: true },
  ],
  chapters: [
    { id: "c1", title: "Context & status pill", startLineId: A.ch_context },
    { id: "c2", title: "Upload queue walkthrough", startLineId: A.ch_queue },
    { id: "c3", title: "Conflicts", startLineId: A.ch_conflicts },
    { id: "c4", title: "Next steps", startLineId: A.ch_next },
  ],
  decisions: [{ text: "Use last-write-wins with a dispatcher conflict list for v1.", lineId: "L032" }],
  followUpEmail: {
    subject: "Offline design review: notes",
    body: `Hi all,

Thanks for a sharp review.

- Status pill: three states (saved on device / waiting for signal / synced).
- Queue: plain-language errors; retry disabled while running.
- Dispatcher copy: "last checked in" instead of "last seen" (Priya).
- Conflicts: last-write-wins + dispatcher conflict list for v1.
- Dev adds a fake network toggle to the dev build by Friday; Priya's clickable prototype in ~2 weeks.

Open: should technicians ever see a conflict? I'll write this up with the other open questions.

Sofia`,
  },
  suggestedPrompts: ["What are the three status pill states?", "How will conflicts work?", "What's still undecided?"],
  highlights: [{ id: "hl-dr-feedback", type: "feedback", title: "\"Last checked in\" is more honest", startLineId: "L023", endLineId: A.ai_copy }],
  scratchpad: `- Pill copy final?
- @Priya send updated dispatcher copy by Friday`,
  vocabSuggestions: [],
};
