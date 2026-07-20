import type { ReactNode } from 'react';

/** Inline empty message for tables/lists (not a full card). */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="p-11 text-center text-[13px] font-medium text-faint">{children}</div>
  );
}
