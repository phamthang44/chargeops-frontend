export interface PaginationProps {
  label: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** "Hiển thị 1–10 / 42" + Trước/Sau buttons. */
export function Pagination({ label, canPrev, canNext, onPrev, onNext }: PaginationProps) {
  const btn = (enabled: boolean) =>
    `rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold ${
      enabled ? 'cursor-pointer bg-white hover:bg-canvas' : 'cursor-not-allowed opacity-40'
    }`;
  return (
    <div className="flex items-center justify-between px-4 py-[11px] text-[12px] font-medium text-muted">
      <span>{label}</span>
      <div className="flex gap-[7px]">
        <button disabled={!canPrev} onClick={onPrev} className={btn(canPrev)}>
          Trước
        </button>
        <button disabled={!canNext} onClick={onNext} className={btn(canNext)}>
          Sau
        </button>
      </div>
    </div>
  );
}
