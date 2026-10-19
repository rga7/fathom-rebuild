// Minimal stroke icons (24px grid). Inline so there is no icon dependency.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 16, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: P) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </I>
);
export const IconPlay = (p: P) => (
  <I {...p}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </I>
);
export const IconPause = (p: P) => (
  <I {...p}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
  </I>
);
export const IconBack10 = (p: P) => (
  <I {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="700">
      10
    </text>
  </I>
);
export const IconFwd10 = (p: P) => (
  <I {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <text x="12" y="15.5" fontSize="7.5" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="700">
      10
    </text>
  </I>
);
export const IconLink = (p: P) => (
  <I {...p}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </I>
);
export const IconCopy = (p: P) => (
  <I {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </I>
);
export const IconCheck = (p: P) => (
  <I {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </I>
);
export const IconChevronDown = (p: P) => (
  <I {...p}>
    <path d="m6 9 6 6 6-6" />
  </I>
);
export const IconChevronUp = (p: P) => (
  <I {...p}>
    <path d="m6 15 6-6 6 6" />
  </I>
);
export const IconArrowLeft = (p: P) => (
  <I {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </I>
);
export const IconArrowUp = (p: P) => (
  <I {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </I>
);
export const IconSparkle = (p: P) => (
  <I {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </I>
);
export const IconList = (p: P) => (
  <I {...p}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </I>
);
export const IconChecklist = (p: P) => (
  <I {...p}>
    <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17M11 6h10M11 12h10M11 18h10" />
  </I>
);
export const IconPencil = (p: P) => (
  <I {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </I>
);
export const IconPlus = (p: P) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconTrash = (p: P) => (
  <I {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </I>
);
export const IconX = (p: P) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);
export const IconRecord = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
  </I>
);
export const IconSend = (p: P) => (
  <I {...p}>
    <path d="M4 12 20 4l-4 16-4-7z" />
    <path d="m12 13 8-9" />
  </I>
);
export const IconFilter = (p: P) => (
  <I {...p}>
    <path d="M4 5h16l-6 7.5V19l-4 1v-7.5z" />
  </I>
);
export const IconHighlight = (p: P) => (
  <I {...p}>
    <path d="m9 15-3 3H3l3-3M9 15l6-6 3 3-6 6zM15 9l2-2 3 3-2 2" />
  </I>
);
export const IconQuestion = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
  </I>
);
export const IconKeyboard = (p: P) => (
  <I {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </I>
);
export const IconMail = (p: P) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </I>
);
export const IconChapters = (p: P) => (
  <I {...p}>
    <path d="M4 5h3M4 12h3M4 19h3M10 5h10M10 12h10M10 19h10" />
  </I>
);
export const IconBars = (p: P) => (
  <I {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </I>
);
export const IconBookmark = (p: P) => (
  <I {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </I>
);
export const IconBook = (p: P) => (
  <I {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" />
  </I>
);
export const IconDots = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
  </I>
);
export const IconLock = (p: P) => (
  <I {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </I>
);
export const IconGlobe = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </I>
);
export const IconUser = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </I>
);
export const IconCalendar = (p: P) => (
  <I {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </I>
);
export const IconLogo = (p: P) => (
  <I {...p} strokeWidth={2.2}>
    <path d="M4 17c3-6 6-9 8-9s4 3 8 9" />
    <path d="M4 12c3-4 5.5-6 8-6" opacity=".55" />
  </I>
);
export const IconSpeaker = ({ muted, ...p }: P & { muted?: boolean }) => (
  <I {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
  </I>
);
export const IconGear = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </I>
);
export const IconClock = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
);
