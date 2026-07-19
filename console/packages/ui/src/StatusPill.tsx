export type PillTone = 'good' | 'warn' | 'bad' | 'brand' | 'neutral' | 'ink';

const TONES: Record<PillTone, string> = {
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-pill text-warn',
  bad: 'bg-bad-soft text-bad',
  brand: 'bg-brand-soft text-brand',
  neutral: 'bg-line-3 text-muted',
  ink: 'bg-ink text-white',
};

export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
