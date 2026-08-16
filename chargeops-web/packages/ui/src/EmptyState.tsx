import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/** Inline or block empty message for tables/lists. */
export function EmptyState({ title, description, className = '', children }: EmptyStateProps) {
  if (children) {
    return <div className={`p-11 text-center text-[13px] font-medium text-faint ${className}`}>{children}</div>;
  }
  return (
    <div className={`flex flex-col items-center justify-center p-11 text-center ${className}`}>
      {title && <div className="text-[14px] font-bold text-ink">{title}</div>}
      {description && <div className="mt-1 max-w-md text-[12.5px] text-muted">{description}</div>}
    </div>
  );
}

