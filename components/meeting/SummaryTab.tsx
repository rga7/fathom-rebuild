"use client";
import type { TemplateId } from "@/data/types";
import { useStored } from "@/lib/storage";
import { TEMPLATE_HINT, TEMPLATE_LABEL, summaryToText } from "@/lib/summaryText";
import { Menu, MenuItem, MenuLabel } from "../Menu";
import { useCopy } from "../Toaster";
import { IconCheck, IconChevronDown, IconCopy, IconSparkle } from "../icons";
import { SendToMenu } from "./SendToMenu";
import { SummaryView } from "./SummaryView";
import { useMeeting } from "./context";

const ORDER: TemplateId[] = ["general", "one_on_one", "standup", "meddpicc"];

export function SummaryTab({ children }: { children?: React.ReactNode }) {
  const { meeting } = useMeeting();
  const copy = useCopy();
  const [tpl, setTpl] = useStored<TemplateId>(`template:${meeting.id}`, meeting.defaultTemplate);
  const template = ORDER.includes(tpl) ? tpl : meeting.defaultTemplate;
  const sections = meeting.summaries[template];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Menu
          label="Change summary template"
          panelClassName="w-72"
          button={(open) => (
            <span className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-[15px] font-semibold hover:bg-white/5">
              <IconSparkle size={15} className="text-accent" />
              {TEMPLATE_LABEL[template]} summary
              <IconChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Template · precomputed at seed time</MenuLabel>
              {ORDER.map((id) => (
                <MenuItem key={id} active={id === template} onClick={() => (setTpl(id), close())}>
                  <span className="flex-1">
                    <span className="block text-fg">{TEMPLATE_LABEL[id]}</span>
                    <span className="block text-[11px] text-faint">{TEMPLATE_HINT[id]}</span>
                  </span>
                  {id === template && <IconCheck size={14} className="text-accent" />}
                </MenuItem>
              ))}
            </>
          )}
        </Menu>
        <span className="flex-1" />
        <SendToMenu getText={(f) => summaryToText(meeting, sections, f)} />
        <button
          onClick={() => copy(summaryToText(meeting, sections), "Summary copied")}
          className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-accent-2"
        >
          <IconCopy size={13} /> Copy summary
        </button>
      </div>
      {children}
      <SummaryView sections={sections} />
    </div>
  );
}
