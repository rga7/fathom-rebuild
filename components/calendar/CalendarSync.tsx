"use client";
import { useEffect } from "react";
import { FEED_URL_KEY, useFeedUrl } from "@/lib/calendarStore";
import { syncNow } from "@/lib/calendarSync";
import { readStored } from "@/lib/storage";

const EVERY = 10 * 60_000;

/** Keeps a connected private-link calendar fresh: on load, every 10 minutes, and when the tab becomes visible after a long gap. Renders nothing. */
export function CalendarSync() {
  const [url] = useFeedUrl();
  useEffect(() => {
    if (!url) return;
    let last = Date.now();
    const run = () => {
      last = Date.now();
      void syncNow();
    };
    run();
    const id = setInterval(run, EVERY);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > EVERY && readStored<string | null>(FEED_URL_KEY, null)) run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url]);
  return null;
}
