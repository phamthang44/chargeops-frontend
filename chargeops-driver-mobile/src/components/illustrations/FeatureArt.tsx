import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * Onboarding feature illustrations (Welcome screen), in the same flat two-tone
 * brand style: fast charging, find nearest station, easy payment.
 */
export type FeatureName = 'charging' | 'find' | 'pay';

const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';

interface FeatureArtProps {
  name: FeatureName;
  size?: number;
}

export function FeatureArt({ name, size = 120 }: FeatureArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {name === 'charging' && <Charging />}
      {name === 'find' && <Find />}
      {name === 'pay' && <Pay />}
    </Svg>
  );
}

function Charging() {
  return (
    <>
      <Rect x={20} y={40} width={66} height={44} rx={9} fill="none" stroke={colors.primary} strokeWidth={4} />
      <Rect x={86} y={54} width={8} height={16} rx={3} fill={colors.primary} />
      <Rect x={26} y={46} width={40} height={32} rx={4} fill={colors.primarySoft} />
      <Path d={BOLT} transform="translate(34,38) scale(0.48)" fill={colors.primary} />
    </>
  );
}

function Find() {
  return (
    <>
      <Rect x={18} y={22} width={84} height={76} rx={12} fill={colors.primarySoft} opacity={0.55} />
      <Path
        d="M30 40 H50 M70 34 H92 M28 64 H44 M64 70 H94 M40 86 H86"
        stroke={colors.primaryLight}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Path
        d="M60 30 C49 30 40 39 40 50 C40 65 60 84 60 84 C60 84 80 65 80 50 C80 39 71 30 60 30 Z"
        fill={colors.primary}
      />
      <Path d={BOLT} transform="translate(44,26) scale(0.32)" fill={colors.textInverse} />
    </>
  );
}

function Pay() {
  return (
    <>
      <Rect x={22} y={40} width={64} height={44} rx={8} fill={colors.primary} />
      <Rect x={22} y={50} width={64} height={9} fill={colors.primaryDark} />
      <Rect x={30} y={70} width={22} height={6} rx={3} fill={colors.primarySoft} />
      <Circle cx={84} cy={76} r={17} fill={colors.surface} stroke={colors.primary} strokeWidth={3} />
      <Path
        d="M77 76 l5 5 l9 -11"
        fill="none"
        stroke={colors.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
