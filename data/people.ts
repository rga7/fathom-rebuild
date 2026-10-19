import type { Person, PersonId } from "./types";

/** The signed-in viewer for "My calls". There is no auth; this is a fixed persona. */
export const ME: PersonId = "jordan";

const list: Person[] = [
  { id: "jordan", name: "Jordan Lee", title: "Head of Product", company: "Lumen", color: "#3b82f6" },
  { id: "maya", name: "Maya Chen", title: "VP Engineering", company: "Lumen", color: "#a855f7" },
  { id: "dev", name: "Dev Patel", title: "Staff Engineer, Sync", company: "Lumen", color: "#10b981" },
  { id: "sofia", name: "Sofia Alvarez", title: "Design Lead", company: "Lumen", color: "#f59e0b" },
  { id: "marcus", name: "Marcus Johnson", title: "Head of Sales", company: "Lumen", color: "#ef4444" },
  { id: "aisha", name: "Aisha Rahman", title: "Customer Success Lead", company: "Lumen", color: "#ec4899" },
  { id: "tom", name: "Tom Becker", title: "Security & Compliance", company: "Lumen", color: "#64748b" },
  { id: "lena", name: "Lena Novak", title: "Product Marketing", company: "Lumen", color: "#14b8a6" },
  { id: "priya", name: "Priya Shah", title: "Frontend Engineer", company: "Lumen", color: "#8b5cf6" },
  { id: "ben", name: "Ben Carter", title: "Backend Engineer", company: "Lumen", color: "#0ea5e9" },
  { id: "rachel", name: "Rachel Kim", title: "Director of Field Operations", company: "Brightline Logistics", color: "#f97316" },
  { id: "omar", name: "Omar Haddad", title: "IT Manager", company: "Brightline Logistics", color: "#84cc16" },
  { id: "greg", name: "Greg Walsh", title: "Operations Manager", company: "Orchard Health", color: "#06b6d4" },
  { id: "hana", name: "Hana Sato", title: "Dispatch Lead", company: "Orchard Health", color: "#d946ef" },
  { id: "elena", name: "Elena Ruiz", title: "Candidate, Senior Product Designer", company: "External", color: "#eab308" },
  { id: "victor", name: "Victor Osei", title: "VP Operations", company: "Kessler Field Services", color: "#22c55e" },
  { id: "claire", name: "Claire Dubois", title: "Service Manager", company: "Kessler Field Services", color: "#fb7185" },
];

export const PEOPLE: Record<PersonId, Person> = Object.fromEntries(list.map((p) => [p.id, p]));

export function person(id: PersonId): Person {
  return PEOPLE[id] ?? { id, name: id, title: "", company: "", color: "#52525b" };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function firstName(id: PersonId): string {
  return person(id).name.split(" ")[0];
}
