"use client";
import { HIGHLIGHT_TYPES } from "@/data/types";
import { HIGHLIGHT_META } from "@/lib/highlights";
import { Modal } from "../Modal";
import { IconKeyboard } from "../icons";

const ROWS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Back / forward 10 seconds"],
  ["/", "Search the transcript"],
  ["H", "Start a timed highlight at the playhead; press again to save"],
  ["1–7", "During playback: start a highlight of that type (or change the running one)"],
  ["Esc", "Cancel a running highlight"],
  ["?", "Show this list"],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <table className="w-full text-[13px]">
        <tbody>
          {ROWS.map(([k, v]) => (
            <tr key={k} className="border-b border-line last:border-0">
              <td className="py-1.5 pr-3">
                <kbd className="rounded border border-line-2 bg-raised px-1.5 py-0.5 text-[12px]">{k}</kbd>
              </td>
              <td className="py-1.5 text-muted">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        {HIGHLIGHT_TYPES.map((t) => (
          <span key={t} className="rounded-full px-2 py-0.5" style={{ color: HIGHLIGHT_META[t].color, background: HIGHLIGHT_META[t].color + "1f" }}>
            {HIGHLIGHT_META[t].key} {HIGHLIGHT_META[t].label}
          </span>
        ))}
      </div>
    </Modal>
  );
}

export function ShortcutsButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-fg">
      <IconKeyboard size={17} />
    </button>
  );
}
