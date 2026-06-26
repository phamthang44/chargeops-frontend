import { AppleGlyph, GooglePlayGlyph } from "./Icons";

/** App Store / Google Play download badges (placeholder hrefs until published). */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      <Badge
        glyph={<AppleGlyph className="h-7 w-7" />}
        line1="Tải về trên"
        line2="App Store"
      />
      <Badge
        glyph={<GooglePlayGlyph className="h-6 w-6" />}
        line1="CÓ TRÊN"
        line2="Google Play"
      />
    </div>
  );
}

function Badge({
  glyph,
  line1,
  line2,
}: {
  glyph: React.ReactNode;
  line1: string;
  line2: string;
}) {
  return (
    <a
      href="#tai-ung-dung"
      aria-label={`Tải ${line2}`}
      className="group inline-flex items-center gap-3 rounded-2xl border border-ink-strong/10 bg-ink-strong px-5 py-2.5
        text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-glass"
    >
      <span className="text-white/95">{glyph}</span>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">
          {line1}
        </span>
        <span className="block text-base font-semibold tracking-tight">
          {line2}
        </span>
      </span>
    </a>
  );
}
