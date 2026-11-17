export type PillTone = 'good' | 'warn' | 'bad' | 'brand' | 'neutral' | 'ink';

// `brand` is the in-use / in-progress state (charging, sent, confirmed). It
// renders in the info blue so it never competes with the console accent.
const TONES: Record<PillTone, string> = {
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-pill text-warn',
  bad: 'bg-bad-soft text-bad',
  brand: 'bg-info-soft text-info',
  neutral: 'bg-chip text-muted',
  ink: 'bg-solid text-solid-fg',
};

export function StatusPill({
  tone,
  label,
  className = '',
}: {
  tone: PillTone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-[2px] text-[11.5px] font-medium ${TONES[tone]} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
