/**
 * ChargeOps brand mark + wordmark.
 * The bolt path and proportions match the app's BrandMark
 * (chargeops-driver-mobile/src/components/brand/Logo.tsx) exactly.
 */
const BOLT = "M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z";

export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <rect x={4} y={4} width={92} height={92} rx={24} fill="#10B981" />
      <circle cx={50} cy={50} r={33} fill="#ffffff" opacity={0.12} />
      <path d={BOLT} transform="translate(14,11) scale(0.72)" fill="#ffffff" />
    </svg>
  );
}

export function Logo({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <BrandMark size={size} />
      <span
        className="font-bold tracking-tight text-ink-strong"
        style={{ fontSize: size * 0.62 }}
      >
        Charge<span className="text-primary">Ops</span>
      </span>
    </span>
  );
}
