export const FLAGSHIP_HREF = "/meetings/q1-planning-atlas-2";

export function meetingHref(id: string, t?: number) {
  return `/meetings/${id}${t !== undefined ? `?t=${Math.floor(t)}` : ""}`;
}
