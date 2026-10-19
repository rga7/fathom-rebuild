import type { MeetingKind } from "@/data/types";

export const KIND_META: Record<MeetingKind, { label: string; from: string; to: string }> = {
  planning: { label: "Planning", from: "#4338ca", to: "#7c3aed" },
  one_on_one: { label: "1:1", from: "#0f766e", to: "#14b8a6" },
  standup: { label: "Standup", from: "#15803d", to: "#65a30d" },
  sales_discovery: { label: "Sales discovery", from: "#c2410c", to: "#f59e0b" },
  customer_call: { label: "Customer call", from: "#be185d", to: "#f472b6" },
  interview: { label: "Interview", from: "#a16207", to: "#eab308" },
  design_review: { label: "Design review", from: "#6d28d9", to: "#c084fc" },
  monologue: { label: "Solo recording", from: "#334155", to: "#64748b" },
  metrics_review: { label: "Metrics review", from: "#0e7490", to: "#22d3ee" },
  kickoff: { label: "Kickoff", from: "#047857", to: "#34d399" },
};
