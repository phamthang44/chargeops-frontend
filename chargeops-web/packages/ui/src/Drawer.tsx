import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX } from './icons';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Header title node (left side). */
  title: ReactNode;
  /** Width, e.g. "460px". */
  width?: string;
  /** Sticky footer actions. */
  footer?: ReactNode;
  children: ReactNode;
}

/** Right-side slide-over drawer (booking detail, etc.). Escape closes. */
export function Drawer({ open, onClose, title, width = '460px', footer, children }: DrawerProps) {
  const { t } = useTranslation('ui');
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-night/40"
        style={{ animation: 'fadeIn .15s ease' }}
      />
      <div
        className="fixed inset-y-0 right-0 z-41 flex max-w-[100vw] flex-col bg-white shadow-[-8px_0_30px_rgba(0,0,0,.12)]"
        style={{ width, animation: 'drawerIn .22s cubic-bezier(.2,.7,.2,1)' }}
      >
        <div className="flex items-center justify-between border-b border-line-3 px-[18px] py-4">
          <div className="flex items-center gap-2.5">{title}</div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-chip"
            aria-label={t('drawer.close')}
          >
            <IconX size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-[15px] overflow-y-auto p-[18px]">{children}</div>
        {footer && <div className="flex gap-2.5 border-t border-line-3 px-[18px] py-4">{footer}</div>}
      </div>
    </>
  );
}
