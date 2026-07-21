import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Panel max-width in px. */
  maxWidth?: number;
  children: ReactNode;
}

/** Centered modal: dimmed overlay (click or Escape closes) + popIn panel. */
export function Modal({ open, onClose, maxWidth = 460, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/40 p-5"
      style={{ animation: 'fadeIn .15s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-panel bg-surface p-[22px]"
        style={{ maxWidth, animation: 'popIn .18s ease' }}
      >
        {children}
      </div>
    </div>
  );
}
