import type { SVGProps } from "react";

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

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="m4 12.5 5 5 11-11" />
  </Line>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
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

export const ShieldCheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Line>
);

export const DocumentIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </Line>
);

export const PrinterIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Line>
);

export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Line>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Line>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Line>
);

export const SparklesIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </Line>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Line {...p}>
    <path d="m9 18 6-6-6-6" />
  </Line>
);
