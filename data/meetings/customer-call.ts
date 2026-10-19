import type { Meeting } from "../types";
import { customerCallAnchors as A, customerCallLines } from "../generated/customer-call.ts";

export const customerCall: Meeting = {
  id: "orchard-check-in",
  shareToken: "UMCcA8yuCZZaA1DAhSiw",
  title: "Orchard Health: quarterly check-in",
  kind: "customer_call",
  startedAt: "2026-10-06T19:00:00Z",
  hostId: "aisha",
  participants: ["aisha", "jordan", "greg", "hana"],
  snippet:
    "Silent photo-upload failures cost Orchard a rejected hospital invoice, and their February renewal is at risk. The iOS drafts fix ships the week after next; Orchard joins the offline beta, and Aisha starts a monthly failed-upload report.",
  lines: customerCallLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Quarterly check-in with Orchard Health focused on app reliability ahead of their February renewal." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Photo uploads fail silently", text: "Technicians see no error; dispatch chases them after they've driven away.", cite: A.silent_fail },
          { lead: "Business impact", text: "A hospital customer rejected an invoice over missing inspection photos.", cite: A.invoice_reject },
          { lead: "iPad drafts", text: "Fix is in the current sprint; production the week after next.", cite: A.ios_fix },
          { lead: "Renewal risk", text: "Greg's boss is asking about alternatives; Greg needs failed uploads down by half by January.", cite: A.ch_renewal },
        ],
      },
      {
        heading: "Next steps",
        bullets: [
          { text: "Aisha confirms the release date and trains Hana's team.", cite: A.ai_confirm_release },
          { text: "Aisha sends a monthly failed-upload report starting early November.", cite: A.ai_monthly_report },
          { text: "Jordan brings Dev to the next call.", cite: A.ai_bring_dev },
        ],
      },
      { heading: "Open questions", bullets: [{ text: "Can techs get an upload progress indicator before the full queue ships?", cite: A.q_progress }] },
    ],
    one_on_one: [
      { heading: "Format note", body: "Customer call rendered as 1:1 sections." },
      { heading: "Blockers", bullets: [{ text: "Silent photo failures and lost iPad drafts.", cite: A.ch_issues }] },
      { heading: "Feedback", bullets: [{ text: "Greg appreciated the straight answers and a real date.", cite: A.ios_fix }] },
      { heading: "Follow-ups", bullets: [{ text: "Monthly report; bring engineering to next call.", cite: A.ai_monthly_report }] },
    ],
    standup: [
      { heading: "Format note", body: "Customer call rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Aisha", text: "Next: confirm release date, set up monthly report.", cite: A.ai_monthly_report },
          { lead: "Jordan", text: "Next: bring Dev to the next call; check on an interim progress bar.", cite: A.ai_bring_dev },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Renewal conversation, not a new deal. Fields mapped to renewal risk." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "Failed photo uploads down 50% by January.", cite: A.ch_renewal },
          { lead: "Economic buyer", text: "Greg's boss (unnamed) decides the February renewal." },
          { lead: "Decision criteria", text: "Fewer missing photos, no more rejected invoices." },
          { lead: "Decision process", text: "Greg forwards monthly reports to his boss ahead of renewal." },
          { lead: "Paper process", text: "Renewal in February." },
          { lead: "Identify pain", text: "Rejected hospital invoice due to missing photos.", cite: A.invoice_reject },
          { lead: "Champion", text: "Greg Walsh, Operations Manager." },
          { lead: "Competition", text: "Boss asked about \"other options\"; none named." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Confirm the iPad drafts fix release date and walk Hana's team through it", owner: "aisha", due: "2026-10-20", sourceLineId: A.ai_confirm_release },
    { id: "a2", text: "Send Greg a monthly failed-upload report (first one early November)", owner: "aisha", due: "2026-11-03", sourceLineId: A.ai_monthly_report },
    { id: "a3", text: "Bring Dev to the next Orchard call", owner: "jordan", due: "2026-10-27", sourceLineId: A.ai_bring_dev },
  ],
  questions: [
    { id: "q1", lineId: "L014", answered: true },
    { id: "q2", lineId: "L020", answered: true },
    { id: "q3", lineId: "L039", answered: true },
    { id: "q4", lineId: A.q_progress, answered: false },
  ],
  chapters: [
    { id: "c1", title: "Open", startLineId: A.ch_open },
    { id: "c2", title: "Photo uploads & iPad drafts", startLineId: A.ch_issues },
    { id: "c3", title: "Renewal", startLineId: A.ch_renewal },
    { id: "c4", title: "Wrap-up", startLineId: A.ch_wrap },
  ],
  decisions: [{ text: "Orchard will join the offline beta (Android).", lineId: "L019" }],
  followUpEmail: {
    subject: "Follow-up from our check-in",
    body: `Hi Greg and Hana,

Thank you both for being so direct today.

- iPad drafts: the fix is in our current sprint and should reach production the week after next. I'll confirm the exact date and walk Hana's team through it.
- Photo uploads: we're building an upload queue that keeps photos on the device until they send, with a dispatcher indicator. Orchard is on the list for the beta.
- Reporting: starting early November I'll send a monthly failed-upload report you can share internally.
- Jordan will bring Dev, our lead engineer on uploads, to our next call.

We're also checking whether an interim progress indicator is possible sooner.

Best,
Aisha`,
  },
  suggestedPrompts: ["What is putting the renewal at risk?", "When does the iPad fix ship?", "What would save Hana time?"],
  highlights: [
    { id: "hl-orch-objection", type: "objection", title: "Renewal at risk in February", startLineId: "L030", endLineId: "L031" },
    { id: "hl-orch-feedback", type: "feedback", title: "Photos fail with no error", startLineId: A.silent_fail, endLineId: A.silent_fail },
  ],
  scratchpad: `Orchard

- Renewal Feb. Greg is on our side but needs proof.
- @Jordan ask Dev about an interim progress bar by Friday`,
  vocabSuggestions: [],
};
