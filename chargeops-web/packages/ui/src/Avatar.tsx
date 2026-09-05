import { buildImageKitUrl } from './utils/imagekit';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarTone = 'brand' | 'owner' | 'neutral';

export interface AvatarProps {
  /** Used for initials fallback and the alt text — always pass one. */
  name: string;
  src?: string | null;
  size?: AvatarSize;
  /** Soft-tint background when there's no photo. */
  tone?: AvatarTone;
  /** Small ring dot, bottom-right — role/presence indicator. */
  statusDot?: 'good' | 'warn' | 'bad' | null;
  className?: string;
}

const SIZE: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-[26px] w-[26px] text-[10.5px]',
  md: 'h-[34px] w-[34px] text-[12px]',
  lg: 'h-11 w-11 text-[15px]',
};

const PIXEL_SIZE: Record<AvatarSize, number> = {
  xs: 40,
  sm: 52,
  md: 68,
  lg: 88,
};

const TONE: Record<AvatarTone, string> = {
  brand: 'bg-brand-soft text-brand',
  owner: 'bg-owner-soft text-owner-deep',
  neutral: 'bg-chip text-muted',
};

const DOT: Record<NonNullable<AvatarProps['statusDot']>, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Circular person avatar — photo with an initials fallback. Always circular by design. */
export function Avatar({ name, src, size = 'md', tone = 'neutral', statusDot = null, className = '' }: AvatarProps) {
  const optimizedSrc = src
    ? buildImageKitUrl(src, {
        width: PIXEL_SIZE[size],
        height: PIXEL_SIZE[size],
        quality: 85,
        focus: 'center',
      })
    : undefined;

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {optimizedSrc ? (
        <img src={optimizedSrc} alt={name} className={`rounded-full object-cover ${SIZE[size]}`} />
      ) : (
        <span
          className={`flex items-center justify-center rounded-full font-semibold ${SIZE[size]} ${TONE[tone]}`}
          aria-label={name}
        >
          {initialsOf(name)}
        </span>
      )}
      {statusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface ${DOT[statusDot]}`}
        />
      )}
    </span>
  );
}
