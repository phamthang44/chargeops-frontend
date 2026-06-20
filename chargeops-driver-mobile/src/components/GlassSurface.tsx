import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

// Evaluated once: true only on iOS 26+ where the native Liquid Glass effect exists.
const LIQUID_GLASS = isLiquidGlassAvailable();

interface GlassSurfaceProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  glassEffectStyle?: 'clear' | 'regular';
  /** Solid background used when Liquid Glass is unavailable (older iOS / Android). */
  fallbackColor?: string;
}

/**
 * A surface that renders the native iOS 26 Liquid Glass effect when available,
 * and falls back to a solid color otherwise. Use for floating bars that sit over
 * scrolling content (filter bar, sticky CTA) — where the glass effect actually reads.
 */
export function GlassSurface({
  children,
  style,
  glassEffectStyle = 'regular',
  fallbackColor = colors.surface,
}: GlassSurfaceProps) {
  if (LIQUID_GLASS) {
    return (
      <GlassView style={style} glassEffectStyle={glassEffectStyle}>
        {children}
      </GlassView>
    );
  }
  return <View style={[style, { backgroundColor: fallbackColor }]}>{children}</View>;
}
