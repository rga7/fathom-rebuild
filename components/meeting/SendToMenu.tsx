"use client";
import { Menu, MenuItem, MenuLabel } from "../Menu";
import { useCopy } from "../Toaster";
import { IconChevronDown, IconSend } from "../icons";

const TARGETS = [
  { name: "Notion", format: "markdown" },
  { name: "Google Docs", format: "plain" },
  { name: "Slack", format: "markdown" },
  { name: "Gmail", format: "plain" },
  { name: "Asana", format: "plain" },
  { name: "Todoist", format: "plain" },
] as const;

/** Integration stub: formats the text and copies it. Nothing is sent anywhere. */
export function SendToMenu({ getText, label = "Send to…" }: { getText: (format: "markdown" | "plain") => string; label?: string }) {
  const copy = useCopy();
  return (
    <Menu
      label={label}
      align="right"
      button={() => (
        <span className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-muted hover:border-faint hover:text-fg">
          <IconSend size={13} /> {label} <IconChevronDown size={12} />
        </span>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Copies to clipboard · no integration connected</MenuLabel>
          {TARGETS.map((t) => (
            <MenuItem
              key={t.name}
              onClick={() => {
                close();
                copy(getText(t.format), `Copied, formatted for ${t.name}. Paste it there (integration is a stub).`);
              }}
            >
              {t.name}
            </MenuItem>
          ))}
        </>
      )}
    </Menu>
  );
}
