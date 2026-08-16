import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconDots } from './icons';

export interface MoreMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

export interface MoreMenuProps {
  items: MoreMenuItem[];
  /** Custom trigger element; defaults to a kebab (⋮) icon button. */
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/** Three-dot overflow menu for secondary actions — table rows, card headers, the header avatar. */
export function MoreMenu({ items, trigger, align = 'right', className = '' }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 190px below, pop open upwards
      setOpenUpwards(spaceBelow < 190 && rect.top > 190);
    }

    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer" role="button" aria-haspopup="menu" aria-expanded={open}>
        {trigger ?? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-chip transition-colors">
            <IconDots size={16} strokeWidth={2.2} />
          </span>
        )}
      </div>
      {open && (
        <div
          role="menu"
          className={`absolute z-[60] min-w-[175px] overflow-hidden rounded-[11px] border border-line-2 bg-surface py-1.5 shadow-[0_12px_32px_rgba(0,0,0,.18)] ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ animation: 'popIn .12s ease' }}
        >
          {items.map((it) => (
            <button
              key={it.key}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12.5px] font-medium transition-colors ${
                it.tone === 'danger' ? 'text-bad hover:bg-bad-soft' : 'text-body hover:bg-chip'
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

