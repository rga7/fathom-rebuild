import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CalendarSync } from "@/components/calendar/CalendarSync";
import { Toaster } from "@/components/Toaster";

export const metadata: Metadata = {
  title: "Fathom rebuild",
  description: "An unofficial rebuild of an AI meeting notetaker, with seeded data and simulated playback.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#09090b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[13px] leading-5">
        <Toaster>
          <CalendarSync />
          {children}
        </Toaster>
      </body>
    </html>
  );
}
