import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Panel max-width in px. */
  maxWidth?: number;
  children: ReactNode;
}

/** Centered modal: dimmed overlay (click or Escape closes) + popIn panel. Uses portal to render above all stacking contexts. */
export function Modal({ open, onClose, maxWidth = 460, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-night/50 p-5 backdrop-blur-[2px]"
      style={{ animation: 'fadeIn .15s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-panel border border-line-2 bg-surface p-[22px] shadow-[0_20px_50px_rgba(0,0,0,.25)]"
        style={{ maxWidth, animation: 'popIn .18s ease' }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

