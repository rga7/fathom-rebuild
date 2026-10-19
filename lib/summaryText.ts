import type { Meeting, SummaryBullet, SummarySection, TemplateId } from "../data/types.ts";
import { lineStart } from "./derive.ts";
import { clock, shortDate } from "./format.ts";

export const TEMPLATE_LABEL: Record<TemplateId, string> = {
  general: "General",
  one_on_one: "1:1",
  standup: "Standup",
  meddpicc: "Sales · MEDDPICC",
};

export const TEMPLATE_HINT: Record<TemplateId, string> = {
  general: "Purpose, takeaways, decisions, topics, open questions",
  one_on_one: "Check-in, wins, blockers, feedback, growth",
  standup: "Yesterday / today / blockers per person",
  meddpicc: "Metrics, economic buyer, decision criteria and process…",
};

export type CopyFormat = "markdown" | "plain";

export function summaryToText(m: Meeting, sections: SummarySection[], format: CopyFormat = "markdown"): string {
  const md = format === "markdown";
  const out: string[] = [md ? `# ${m.title}` : m.title, shortDate(m.startedAt), ""];
  const bullet = (b: SummaryBullet, depth: number) => {
    const ts = b.cite ? ` [${clock(lineStart(m, b.cite))}]` : "";
    const lead = b.lead ? (md ? `**${b.lead}:** ` : `${b.lead}: `) : "";
    out.push(`${"  ".repeat(depth)}- ${lead}${b.text}${ts}`);
    b.children?.forEach((c) => bullet(c, depth + 1));
  };
  for (const s of sections) {
    out.push(md ? `## ${s.heading}` : s.heading.toUpperCase());
    if (s.body) out.push(s.body);
    s.bullets?.forEach((b) => bullet(b, 0));
    out.push("");
  }
  return out.join("\n").trim() + "\n";
}
