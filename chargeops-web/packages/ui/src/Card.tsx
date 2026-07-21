import type { HTMLAttributes } from 'react';

/** Standard white card: 1px line border, 12px radius. */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-card border border-line-2 bg-surface ${className}`} {...rest} />;
}
