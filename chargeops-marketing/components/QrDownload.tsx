import { BrandMark } from "./Logo";

/**
 * Stylized scan-to-download block. The QR pattern is decorative (a real encoded
 * QR can be dropped in once the store URLs exist). It reads as "scan to install"
 * and reinforces the mobile-first funnel.
 */
export function QrDownload() {
  // Deterministic pseudo-random module grid (no hydration mismatch).
  const N = 11;
  const cells = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N);
    const c = i % N;
    const finder =
      (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
    const on = ((r * 7 + c * 13 + r * c * 3) % 5 < 2) && !finder;
    return { i, on, finder };
  });

  return (
    <div className="flex items-center gap-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="relative grid h-28 w-28 shrink-0 grid-cols-11 gap-[2px] rounded-xl bg-white p-2">
        {cells.map((cell) =>
          cell.finder ? (
            <span key={cell.i} className="bg-transparent" />
          ) : (
            <span
              key={cell.i}
              className={`rounded-[1px] ${cell.on ? "bg-ink-strong" : "bg-transparent"}`}
            />
          )
        )}
        {/* Finder squares */}
        <Finder className="left-2 top-2" />
        <Finder className="right-2 top-2" />
        <Finder className="bottom-2 left-2" />
        {/* Center brand chip */}
        <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white shadow">
          <BrandMark size={22} />
        </span>
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-ink-strong">Quét để tải app</p>
        <p className="mt-1 text-sm text-ink-muted">
          Mở camera điện thoại và quét mã để cài ChargeOps.
        </p>
      </div>
    </div>
  );
}

function Finder({ className }: { className?: string }) {
  return (
    <span
      className={`absolute h-6 w-6 rounded-[6px] border-[3px] border-ink-strong ${className ?? ""}`}
    >
      <span className="absolute inset-1 rounded-[2px] bg-ink-strong" />
    </span>
  );
}
