import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Single-border policy: set to `false` when the card sits inside an
   * already-bordered container (Modal, SidePanel, Card, framed panel) so the
   * composition never renders two nested outlines.
   */
  bordered?: boolean;
}

/** Standard white card: 1px line border, 12px radius. */
export function Card({ className = '', bordered = true, ...rest }: CardProps) {
  const border = bordered ? 'border border-line' : '';
  return <div className={`rounded-card ${border} bg-surface ${className}`} {...rest} />;
}
