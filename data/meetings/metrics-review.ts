import type { Meeting } from "../types";
import { metricsReviewAnchors as A, metricsReviewLines } from "../generated/metrics-review.ts";

export const metricsReview: Meeting = {
  id: "weekly-metrics-sep-8",
  shareToken: "dPhFiQgGOB2Vf9R85FSL",
  title: "Weekly metrics review",
  kind: "metrics_review",
  startedAt: "2026-09-08T17:00:00Z",
  hostId: "jordan",
  participants: ["jordan", "maya", "marcus", "aisha", "lena"],
  snippet:
    "August new ARR was $620K vs $650K plan (two deals slipped). 3 of 4 churned accounts cited offline data loss. Activation is up to 68%, but only ~40% of accounts turn on custom forms. Uptime 99.96%.",
  lines: metricsReviewLines,
  defaultTemplate: "general",
  summaries: {
    general: [
      { heading: "Meeting purpose", body: "Weekly review of revenue, retention, usage, and engineering metrics." },
      {
        heading: "Key takeaways",
        bullets: [
          { lead: "Revenue", text: "August new ARR $620K vs $650K plan; two verbal deals slipped to September. Pipeline coverage 2.8x.", cite: A.aug_arr },
          { lead: "Security friction", text: "SSO and SOC 2 come up in almost every deal over $100K.", cite: A.security_trend },
          { lead: "Churn", text: "4 accounts churned; 3 cited losing work offline. Now over half of churn reasons.", cite: A.churn_aug },
          { lead: "Activation", text: "68% (up from 61%); custom forms adoption ~40%, as setup takes ~40 minutes.", cite: A.ch_usage },
          { lead: "Engineering", text: "99.96% uptime; one 40-minute photo store outage from an expired certificate.", cite: A.ch_eng },
        ],
      },
      { heading: "Next steps", bullets: [{ text: "Marcus quantifies deals blocked on security.", cite: A.ai_marcus_count }, { text: "Aisha builds a two-quarter churn-reason breakdown.", cite: A.ai_churn_breakdown }] },
    ],
    one_on_one: [
      { heading: "Format note", body: "Metrics review rendered as 1:1 sections." },
      { heading: "Wins", bullets: [{ text: "Activation up 7 points from the onboarding checklist.", cite: A.ch_usage }] },
      { heading: "Blockers", bullets: [{ text: "Offline data loss is now the top churn reason.", cite: A.churn_aug }] },
    ],
    standup: [
      { heading: "Format note", body: "Metrics review rendered as a standup." },
      {
        heading: "Per person",
        bullets: [
          { lead: "Marcus", text: "Two deals slipping; will count security-blocked deals.", cite: A.ai_marcus_count },
          { lead: "Aisha", text: "Churn breakdown before the offsite.", cite: A.ai_churn_breakdown },
          { lead: "Lena", text: "Activation 68%; pushing form templates.", cite: A.forms_templates },
          { lead: "Maya", text: "Uptime 99.96%; Postgres upgrade in Q1.", cite: A.ch_eng },
        ],
      },
    ],
    meddpicc: [
      { heading: "Format note", body: "Internal metrics review. Pipeline-level fields only." },
      {
        heading: "MEDDPICC",
        bullets: [
          { lead: "Metrics", text: "$620K new ARR; 2.8x pipeline coverage.", cite: A.aug_arr },
          { lead: "Economic buyer", text: "Not discussed." },
          { lead: "Decision criteria", text: "SSO and SOC 2 required in most $100K+ deals.", cite: A.security_trend },
          { lead: "Decision process", text: "Not discussed." },
          { lead: "Paper process", text: "Two deals waiting on paperwork." },
          { lead: "Identify pain", text: "Offline data loss drives churn.", cite: A.churn_aug },
          { lead: "Champion", text: "Not discussed." },
          { lead: "Competition", text: "Not discussed." },
        ],
      },
    ],
  },
  actionItems: [
    { id: "a1", text: "Count deals blocked on SSO/SOC 2 for next week", owner: "marcus", due: "2026-09-15", sourceLineId: A.ai_marcus_count },
    { id: "a2", text: "Break down churn reasons for the last two quarters before the planning offsite", owner: "aisha", due: "2026-10-09", sourceLineId: A.ai_churn_breakdown },
  ],
  questions: [
    { id: "q1", lineId: "L008", answered: true },
    { id: "q2", lineId: "L017", answered: true },
    { id: "q3", lineId: "L026", answered: true },
    { id: "q4", lineId: "L028", answered: false },
  ],
  chapters: [
    { id: "c1", title: "Revenue & pipeline", startLineId: A.ch_revenue },
    { id: "c2", title: "Retention", startLineId: A.ch_retention },
    { id: "c3", title: "Usage", startLineId: A.ch_usage },
    { id: "c4", title: "Engineering", startLineId: A.ch_eng },
  ],
  decisions: [],
  followUpEmail: {
    subject: "Metrics review: week of Sep 8",
    body: `All,

- New ARR (Aug): $620K vs $650K plan; two deals slipped.
- Churn: 4 accounts; 3 cited offline data loss.
- Activation: 68% (from 61%); forms adoption ~40%.
- Uptime: 99.96%; cert-expiry outage fixed and monitored.

Asks: Marcus to count security-blocked deals; Aisha to break down churn reasons before the offsite.

Jordan`,
  },
  suggestedPrompts: ["Why did churn go up?", "How many deals are blocked on security?", "What's happening with activation?"],
  highlights: [{ id: "hl-met-insight", type: "insight", title: "Offline is now over half of churn reasons", startLineId: A.churn_aug, endLineId: "L016" }],
  scratchpad: `- Form templates: raise at planning.`,
  vocabSuggestions: [{ from: "post gress", to: "Postgres" }],
};
