import type { SVGProps } from "react";

/* Line-icon system — 24px grid, stroke = currentColor, rounded joins.
   Matches the app's Ionicons-style line iconography. */
function Line(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Line>
);

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
    <path d="M3.5 9h17M8 3v3m8-3v3m-7.5 9 2 2 4-4" />
  </Line>
);

export const QrIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1.5" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1.5" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1.5" />
    <path d="M14.5 14.5h2v2m4 0v4m-6 0h2m2-6h2" />
  </Line>
);

export const BatteryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <rect x="2.5" y="7.5" width="16" height="9" rx="2.5" />
    <path d="M21.5 11v2M11 9.5 8.5 13H12l-2.5 3.5" />
  </Line>
);

export const CardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
    <path d="M2.5 9.5h19M6 14.5h4" />
  </Line>
);

export const RefundIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M4 5v5h5" />
    <path d="M4.5 10a8 8 0 1 1-1 5.5" />
  </Line>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
  </Line>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="m4 12.5 5 5 11-11" />
  </Line>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="m12 2 2.95 6.13 6.74.86-4.96 4.62 1.27 6.69L12 17.97 6 20.3l1.27-6.69L2.31 9l6.74-.87L12 2Z" />
  </svg>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="m9 5 7 7-7 7" />
  </Line>
);

export const BuildingIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
  </Line>
);

export const PlugIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M12 22v-5" />
    <path d="M7 17h10a1 1 0 0 0 1-1v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2a1 1 0 0 0 1 1Z" />
    <path d="M9 10V6M15 10V6M9 6V3m6 3V3" />
  </Line>
);

export const CarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M5 17h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2l-2-4H7L5 10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2Z" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="16.5" cy="17" r="1.5" />
  </Line>
);

export const CoffeeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M17 8h1a3 3 0 0 1 0 6h-1" />
    <path d="M3 8h14v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8Z" />
    <path d="M6 2v3M10 2v3M14 2v3" />
  </Line>
);

export const ACPlugIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M12 22v-5" />
    <path d="M7 17h10a1 1 0 0 0 1-1v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2a1 1 0 0 0 1 1Z" />
    <path d="M9 10V3m6 7V3" />
  </Line>
);

/* --- Brand glyphs (monochrome, inherit color) --- */
export const AppleGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

export const GooglePlayGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
  </svg>
);
