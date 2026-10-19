export const FLAGSHIP_HREF = "/meetings/q1-planning-atlas-2";

export function meetingHref(id: string, t?: number) {
  // Tenths of a second: flooring could land on the previous line.
  return `/meetings/${id}${t !== undefined ? `?t=${Math.round(t * 10) / 10}` : ""}`;
}
