import { initials, person } from "@/data/people";
import type { PersonId } from "@/data/types";

export function Avatar({ id, size = 22, ring = false, title = true }: { id: PersonId; size?: number; ring?: boolean; title?: boolean }) {
  const p = person(id);
  return (
    <span
      title={title ? `${p.name}${p.title ? ` · ${p.title}` : ""}` : undefined}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${ring ? "ring-2 ring-panel" : ""}`}
      style={{ width: size, height: size, background: p.color, fontSize: Math.max(9, size * 0.4) }}
    >
      {initials(p.name)}
    </span>
  );
}

export function AvatarStack({ ids, max = 5, size = 22 }: { ids: PersonId[]; max?: number; size?: number }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i ? -6 : 0 }}>
          <Avatar id={id} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="ml-[-6px] inline-flex items-center justify-center rounded-full bg-raised font-medium text-muted ring-2 ring-panel"
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
