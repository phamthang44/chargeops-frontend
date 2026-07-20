import type { ReactNode } from 'react';

/** Numbered step header used across the pricing screen; optional right-side action. */
export function StepHeader({
  n,
  title,
  action,
}: {
  n: number;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-[11px]">
        <span className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-owner bg-owner-soft text-[13px] font-bold text-owner-deep">
          {n}
        </span>
        <span className="text-[16px] font-bold tracking-[-0.01em]">{title}</span>
      </div>
      {action}
    </div>
  );
}
