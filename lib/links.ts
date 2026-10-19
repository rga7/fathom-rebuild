export const FLAGSHIP_HREF = "/meetings/q1-planning-atlas-2";

export function meetingHref(id: string, t?: number) {
  // Tenths of a second: flooring could land on the previous line.
  const at = t !== undefined ? `t=${Math.round(t * 10) / 10}` : "";
  // Calls from simulated capture exist only in this browser, so they open on the client-side /local route.
  if (id.startsWith("sim-")) return `/local?m=${id}${at ? `&${at}` : ""}`;
  return `/meetings/${id}${at ? `?${at}` : ""}`;
}
