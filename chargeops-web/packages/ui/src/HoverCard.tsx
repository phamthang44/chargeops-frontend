import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface HoverCardProps {
  trigger: ReactNode;
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Shows supplementary content on hover/focus — profile previews, link
 * summaries. Content is supplementary only; never put a required action
 * inside it (it disappears when the cursor leaves).
 */
export function HoverCard({ trigger, children, openDelay = 200, closeDelay = 150, align = 'left', className = '' }: HoverCardProps) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  };
  const hide = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <span className={`relative inline-block ${className}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {trigger}
      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className={`absolute top-full z-45 mt-2 w-64 rounded-[11px] border border-line-2 bg-surface p-3.5 text-left shadow-[0_10px_30px_rgba(16,17,26,.12)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ animation: 'popIn .12s ease' }}
        >
          {children}
        </div>
      )}
    </span>
  );
}
